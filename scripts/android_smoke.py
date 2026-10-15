"""Launch and exercise the installed release APK on a real Android runtime."""
import re
import hashlib
import json
import struct
import subprocess
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path

PACKAGE = "com.ulasugurlu.orbittide"
EVIDENCE = Path("smoke-evidence")
EVIDENCE.mkdir(exist_ok=True)


def adb(*args, timeout=60, check=True):
    result = subprocess.run(
        ["adb", *args], capture_output=True, timeout=timeout
    )
    if check and result.returncode:
        raise RuntimeError(result.stdout.decode(errors="replace") + result.stderr.decode(errors="replace"))
    return result.stdout


def alive():
    if not adb("shell", "pidof", PACKAGE, check=False).strip():
        raise RuntimeError("The Android process exited unexpectedly")


def ui():
    alive()
    adb("shell", "uiautomator", "dump", "/sdcard/orbit-smoke.xml", timeout=30)
    document = adb("shell", "cat", "/sdcard/orbit-smoke.xml")
    (EVIDENCE / "window.xml").write_bytes(document)
    root = ET.fromstring(document)
    # Fresh Google APIs images can show a stock launcher ANR while their
    # background services initialise. Dismiss only this identified system
    # dialog; game errors still fail the process/log checks below.
    if any(node.get("text") == "Pixel Launcher isn't responding" for node in root.iter("node")):
        close = next(node for node in root.iter("node") if node.get("text") == "Close app")
        adb("shell", "input", "tap", *center(close))
        print("INFO: dismissed the emulator's Pixel Launcher ANR", flush=True)
        launch()
        time.sleep(0.5)
        return ET.Element("hierarchy")
    return root


def find(label, enabled=False, timeout=45):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        for node in ui().iter("node"):
            if label in (node.get("text"), node.get("content-desc")):
                # Text children can be enabled while their button is disabled.
                if not enabled or (node.get("enabled") == "true" and node.get("clickable") == "true"):
                    return node
        time.sleep(0.5)
    raise RuntimeError("Visible Android control not found: " + label)


def center(node):
    x1, y1, x2, y2 = map(int, re.findall(r"\d+", node.attrib["bounds"]))
    return str((x1 + x2) // 2), str((y1 + y2) // 2)


def tap(label):
    adb("shell", "input", "tap", *center(find(label, enabled=True)))


def screenshot(name):
    (EVIDENCE / name).write_bytes(adb("exec-out", "screencap", "-p"))


def rendered_game():
    raw = adb("exec-out", "screencap")
    width, height, pixel_format = struct.unpack("<III", raw[:12])
    assert pixel_format == 1, "Expected an RGBA Android framebuffer"
    pixels = memoryview(raw)[-width * height * 4:]
    assert len(pixels) == width * height * 4
    cyan = 0
    # Check only the game scene; the cyan Phase button and score HUD lie
    # outside this rectangle. This catches an empty GL surface after resize.
    for y in range(int(height * .37), int(height * .77)):
        for x in range(int(width * .03), int(width * .97)):
            i = (y * width + x) * 4
            if pixels[i] < 110 and pixels[i + 1] > 125 and pixels[i + 2] > 145:
                cyan += 1
    assert cyan > width * height * .0001, f"3D gameplay surface was empty: {cyan} cyan pixels"
    print(f"PASS: native gameplay orbit rendered ({cyan} cyan pixels)", flush=True)


def launch():
    adb("shell", "am", "start", "-W", "-n", PACKAGE + "/.MainActivity")


try:
    apk = sys.argv[1]
    if len(sys.argv) > 2:
        adb("install", "--no-incremental", "-r", sys.argv[2])
    adb("install", "--no-incremental", "-r", apk)
    print("PASS: previous APK upgrades with the same signing key", flush=True)
    adb("shell", "pm", "clear", PACKAGE)
    adb("logcat", "-c")
    launch()
    find("AKIŞA BAŞLA", enabled=True)
    time.sleep(0.8)
    assert not any("3B görünümü yeniden dene" in (node.get("text"), node.get("content-desc")) for node in ui().iter("node")), "Native 3D renderer fell back to SVG"
    screenshot("01-home.png")
    print("PASS: cold launch reaches a ready home screen", flush=True)
    tap("Kaos")
    screenshot("02-chaos-core.png")
    tap("Koruma")
    for size, density, name in [("1080x1920", "480", "03-home-360.png"), ("960x1704", "480", "04-home-320.png")]:
        adb("shell", "wm", "size", size)
        adb("shell", "wm", "density", density)
        time.sleep(1)
        button = find("AKIŞA BAŞLA", enabled=True)
        _, _, _, bottom = map(int, re.findall(r"\d+", button.attrib["bounds"]))
        assert bottom < int(size.split("x")[1]) - 40, "Start button overlaps Android navigation"
        screenshot(name)
    adb("shell", "wm", "size", "reset")
    adb("shell", "wm", "density", "reset")
    time.sleep(1)
    find("AKIŞA BAŞLA", enabled=True)
    print("PASS: new menu and core controls fit compact Android screens", flush=True)
    tap("Ayarlar")
    find("Akış ayarları")
    tap("English")
    find("Flow settings")
    tap("Türkçe")
    tap("Kapat")
    print("PASS: settings and language switching", flush=True)
    # The score updates continuously during play, so capture the header's
    # position while idle and pause before asking UIAutomator for another tree.
    pause_position = center(find("Kayıtlar"))
    tap("AKIŞA BAŞLA")
    time.sleep(1.5)
    alive()
    screenshot("05-playing.png")
    rendered_game()
    adb("shell", "input", "tap", *pause_position)
    find("Bir nefes.")
    screenshot("06-paused.png")
    tap("DEVAM ET")
    time.sleep(0.7)
    screenshot("08-live-render.png")
    rendered_game()
    print("PASS: game start, pause and resume", flush=True)
    adb("shell", "input", "keyevent", "3")
    time.sleep(1)
    launch()
    find("Bir nefes.")
    tap("Ana ekrana dön")
    find("AKIŞA BAŞLA", enabled=True)
    print("PASS: background and foreground recovery", flush=True)
    for attempt in range(2):
        adb("shell", "am", "force-stop", PACKAGE)
        launch()
        find("AKIŞA BAŞLA", enabled=True)
    time.sleep(10)
    alive()
    screenshot("07-relaunch.png")
    (EVIDENCE / "validation-result.json").write_text(json.dumps({"package": PACKAGE, "apk_sha256": hashlib.sha256(Path(apk).read_bytes()).hexdigest(), "upgrade": True, "ready_menu": True, "native_3d": True, "compact_menu": True, "language": True, "play_pause_resume": True, "background_recovery": True, "cold_relaunches": 2}, indent=2))
    print("PASS: repeated cold launches remain alive", flush=True)
finally:
    screenshot("last-screen.png")
    adb("shell", "wm", "size", "reset", check=False)
    adb("shell", "wm", "density", "reset", check=False)
    log = adb("logcat", "-d", "-v", "threadtime", check=False)
    (EVIDENCE / "logcat.txt").write_bytes(log)
    lines = log.decode(errors="replace").splitlines()
    fatal = False
    for i, line in enumerate(lines):
        if any(word in line for word in ["FATAL EXCEPTION", "Fatal signal", "JavascriptException"]):
            fatal = True
            print("\n".join(lines[max(0, i - 1):i + 20]), flush=True)
    if fatal:
        raise RuntimeError("Fatal Android runtime exception captured in logcat")
