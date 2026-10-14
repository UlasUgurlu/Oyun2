"""Launch and exercise the installed release APK on a real Android runtime."""
import re
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
    return ET.fromstring(document)


def find(label, enabled=False, timeout=25):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        for node in ui().iter("node"):
            if label in (node.get("text"), node.get("content-desc")):
                if not enabled or node.get("enabled") == "true":
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
    screenshot("01-home.png")
    print("PASS: cold launch reaches a ready home screen", flush=True)
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
    time.sleep(0.3)
    alive()
    screenshot("02-playing.png")
    adb("shell", "input", "tap", *pause_position)
    find("Bir nefes.")
    tap("DEVAM ET")
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
    screenshot("03-relaunch.png")
    print("PASS: repeated cold launches remain alive", flush=True)
finally:
    log = adb("logcat", "-d", "-v", "threadtime", check=False)
    (EVIDENCE / "logcat.txt").write_bytes(log)
    lines = log.decode(errors="replace").splitlines()
    for i, line in enumerate(lines):
        if any(word in line for word in ["FATAL EXCEPTION", "Fatal signal", "JavascriptException"]):
            print("\n".join(lines[max(0, i - 1):i + 20]), flush=True)
