"""Original procedural soundtrack and stereo SFX. No downloaded audio samples.
Run: python3 scripts/generate_audio.py (requires numpy and ffmpeg).
"""
from pathlib import Path
import numpy as np
import wave, subprocess

SR = 44100
OUT = Path(__file__).resolve().parents[1] / 'assets' / 'audio'
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(29)

def hz(m): return 440 * 2 ** ((m - 69) / 12)

def write(name, signal, mp3=False):
    signal = np.asarray(signal)
    if signal.ndim == 1: signal = np.column_stack((signal, signal))
    if mp3: signal *= .12 / max(float(np.sqrt(np.mean(signal**2))), .0001)
    signal = np.tanh(signal * 1.15) * .82
    path = OUT / (name + '.wav')
    with wave.open(str(path), 'wb') as f:
        f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR)
        f.writeframes((np.clip(signal, -1, 1) * 32767).astype('<i2').tobytes())
    if mp3:
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(path), '-codec:a', 'libmp3lame', '-b:a', '128k', str(OUT / (name + '.mp3'))], check=True)
        path.unlink()

def chime(freq, length=.55):
    t = np.arange(int(SR * length)) / SR
    envelope = (1 - np.exp(-t * 170)) * np.exp(-t * 7)
    return (np.sin(2*np.pi*freq*t) + .27*np.sin(2*np.pi*freq*2.01*t) + .12*np.sin(2*np.pi*freq*3.98*t)) * envelope * .4

for i, m in enumerate([76, 79, 83, 86]):
    s = chime(hz(m))
    stereo = np.column_stack((s, np.roll(s, 250)))
    write('pickup-' + str(i), stereo)

t = np.arange(int(SR*.27))/SR
freq = 210 + 1650*np.exp(-t*13)
phase = 2*np.pi*np.cumsum(freq)/SR
noise = rng.normal(0, .07, len(t))
s = (np.sin(phase)*.25+noise) * np.sin(np.pi*t/.27)**2
pan = np.linspace(.25,.85,len(s))
write('switch', np.column_stack((s*(1-pan), s*pan)))

combo = np.zeros(int(SR*1.0))
for i,m in enumerate([76,79,83,88]):
    s=chime(hz(m),.7)*.8; start=int(i*.075*SR)
    combo[start:start+len(s)] += s[:len(combo)-start]
write('combo', np.column_stack((combo, np.roll(combo,400))))

t = np.arange(int(SR*.85))/SR
phase = 2*np.pi*np.cumsum(65+220*np.exp(-t*12))/SR
s = np.sin(phase)*np.exp(-t*5)*.6 + rng.normal(0,.25,len(t))*np.exp(-t*13)
s += np.sin(2*np.pi*1480*t) * np.exp(-t*9)*.09
write('crash', np.column_stack((s, np.roll(s,130))))

start = np.zeros(int(SR*.7))
for i,m in enumerate([64,71,76]):
    s=chime(hz(m),.45); pos=int(i*.10*SR)
    start[pos:pos+len(s)] += s
write('start', start)

# 120 BPM, 16 bars. E-minor / C-major / G-major / D-major.
length=32.; n=int(length*SR); t=np.arange(n)/SR
music=np.zeros((n,2)); chords=[[52,55,59,64],[48,52,55,59],[43,50,55,59],[50,54,57,62]]
def add(signal, at, pan=.5):
    global music
    pos=int(at*SR); count=min(len(signal),n-pos)
    if count <= 0: return
    music[pos:pos+count,0] += signal[:count]*(1-pan)
    music[pos:pos+count,1] += signal[:count]*pan

for bar in range(16):
    chord=chords[(bar//4)%4]
    local=np.arange(int(2*SR))/SR
    env=np.sin(np.pi*local/2)**.6
    for j,m in enumerate(chord):
        f=hz(m)
        pad=(np.sin(2*np.pi*f*local)+.2*np.sin(2*np.pi*f*1.003*local))*env*.07
        add(pad,bar*2, .2+j*.2)
    for beat in range(4):
        local=np.arange(int(.5*SR))/SR
        bass=np.sin(2*np.pi*hz(chord[0]-12)*local)*np.exp(-local*8)*.18
        add(bass,bar*2+beat*.5)
        kickPhase=2*np.pi*np.cumsum(48+80*np.exp(-local*45))/SR
        add(np.sin(kickPhase)*np.exp(-local*22)*.18, bar*2+beat*.5)
    for eighth in range(8):
        m=chord[[0,2,3,1,2,3,2,1][eighth]]+12
        arp=chime(hz(m),.5)*.24
        add(arp,bar*2+eighth*.25,.3+.4*(eighth%2))
        h=np.arange(int(.075*SR))/SR
        hat=rng.normal(0,.08,len(h))*np.exp(-h*85)
        add(hat,bar*2+eighth*.25,.75)
# Wrap gentle delay around the loop, preserving the seam.
music += np.roll(music[:,::-1],int(.375*SR),axis=0)*.27
music += np.roll(music,int(.75*SR),axis=0)*.12
write('orbital-drift',music,mp3=True)


# New power-up sounds, also original synthesis.
shield=chime(hz(88),.65)*.6+chime(hz(83),.65)*.4
write('shield',np.column_stack((shield,np.roll(shield,200))))
t=np.arange(int(SR*1.1))/SR
phase=2*np.pi*np.cumsum(95+470*np.exp(-t*3))/SR
nova=np.sin(phase)*np.exp(-t*3)*.25+rng.normal(0,.045,len(t))*np.sin(np.pi*t/1.1)**2
for i,m in enumerate([76,83,88]):
 s=chime(hz(m),.7)*.6;pos=int((.10+i*.10)*SR);nova[pos:pos+len(s)]+=s
write('nova',np.column_stack((nova,np.roll(nova,360))))
victory=np.zeros(int(SR*1.6))
for i,m in enumerate([76,79,83,88,91]):
 s=chime(hz(m),.75)*.8;pos=int(i*.14*SR);victory[pos:pos+len(s)]+=s
write('victory',np.column_stack((victory,np.roll(victory,280))))
print('Created original soundtrack + 11 sound effects in',OUT)
