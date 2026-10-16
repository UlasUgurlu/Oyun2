"""Verify and package a real unsigned iPhone release build, never a simulator app."""
import hashlib
import json
import os
import plistlib
import shutil
import struct
import subprocess
import sys
import zipfile
from pathlib import Path

app = Path(sys.argv[1]).resolve()
assert app.is_dir() and app.name == 'OrbitTide.app', 'Release app missing'
info = plistlib.loads((app / 'Info.plist').read_bytes())
assert info['CFBundleIdentifier'] == 'com.ulasugurlu.orbittide'
assert info['CFBundleShortVersionString'] == '1.3.0'
assert info['CFBundleSupportedPlatforms'] == ['iPhoneOS'], 'Simulator build is not an iPhone IPA'
assert info.get('DTPlatformName') == 'iphoneos'
binary = app / info['CFBundleExecutable']
architectures = subprocess.check_output(['lipo', '-archs', str(binary)], text=True).split()
assert architectures == ['arm64'], architectures
platform = subprocess.check_output(['xcrun', 'vtool', '-show-build', str(binary)], text=True)
assert 'platform IOS' in platform and 'IOSSIMULATOR' not in platform
bundle = app / 'main.jsbundle'
assert bundle.stat().st_size > 100_000, 'Standalone game bundle missing'
assert struct.unpack('<Q', bundle.read_bytes()[:8])[0] == 0x1F1903C103BC1FC6, 'Expected embedded Hermes release bytecode'
assert (app / 'Assets.car').is_file(), 'App icon catalog missing'
assert not (app / 'embedded.mobileprovision').exists(), 'Unsigned build must not claim a provisioning profile'
signature = subprocess.run(['codesign', '-dv', str(app)], capture_output=True, text=True)
assert signature.returncode != 0, 'This distribution must explicitly remain unsigned'

output = Path('delivery-ios').resolve()
output.mkdir(exist_ok=True)
payload = Path('.build/ipa-payload').resolve()
payload.mkdir(exist_ok=True)
target = payload / 'Payload' / app.name
if target.exists():
    shutil.rmtree(target)
shutil.copytree(app, target, symlinks=True)
ipa = output / 'Orbit-Tide-1.3.0-unsigned.ipa'
if ipa.exists():
    ipa.unlink()
subprocess.run(['zip', '-q', '-r', '-y', str(ipa), 'Payload'], cwd=payload, check=True)
with zipfile.ZipFile(ipa) as archive:
    assert archive.testzip() is None
    assert 'Payload/OrbitTide.app/Info.plist' in archive.namelist()
    assert 'Payload/OrbitTide.app/main.jsbundle' in archive.namelist()
    assert all(name.startswith('Payload/') for name in archive.namelist())
digest = hashlib.sha256(ipa.read_bytes()).hexdigest()
(output / 'ipa-sha256.txt').write_text(digest + '  ' + ipa.name + '\n')
(output / 'ios-build-info.json').write_text(json.dumps({
    'version': '1.3.0', 'commit': os.environ['GITHUB_SHA'],
    'game_source_commit': '9eca31bc91c31feb802acd8f9c51edc3fba1d060',
    'bundle_identifier': info['CFBundleIdentifier'],
    'architecture': 'arm64', 'platform': 'iPhoneOS', 'configuration': 'Release',
    'minimum_ios': info['MinimumOSVersion'], 'signed': False,
    'sha256': digest, 'size': ipa.stat().st_size,
    'embedded_hermes': True, 'device_runtime_tested': False,
}, indent=2) + '\n')
(output / 'IPA-README.txt').write_text('''Orbit Tide 1.3.0 - iPhone IPA (UNSIGNED / IMZASIZ)

Bu dosya Xcode ile fiziksel ARM64 iPhone icin derlenmis gercek bir IPA paketidir.
APK veya simulator uygulamasi degildir. Oyun kodu, 3B gorseller ve sesler dahildir.

ONEMLI: Apple imzasi ve provisioning profili yoktur. Dosyaya dokunarak veya
uzantisini degistirerek iPhone'a kuramazsiniz. Kurulumdan once kendi Apple
hesabinizla veya guvendiginiz bir dagitim yontemiyle yeniden imzalanmalidir.
Apple Developer hesabi, sertifika veya telefona erisim bu derlemede kullanilmadi.
Gercek iPhone'da kurulum ve calisma testi yapilmadi.

This is an unsigned physical-iPhone Release build. It requires valid signing
before installation. Downloading this file alone does not install the game.
Do not share your Apple ID password or use unknown enterprise certificates.
''')
print(json.dumps({'result': 'PASS', 'ipa': ipa.name, 'bytes': ipa.stat().st_size,
                  'sha256': digest, 'signed': False, 'architecture': architectures,
                  'minimum_ios': info['MinimumOSVersion']}))
