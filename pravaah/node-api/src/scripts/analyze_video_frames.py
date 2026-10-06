import sys
import os
import json
import cv2
import numpy as np

def analyze_video(vpath):
    if not os.path.exists(vpath):
        # Fallback if file not on disk
        return {
            "density": 48,
            "crowdLevel": "MODERATE",
            "status": "CONTROLLED",
            "flow": "STEADY INFLOW",
            "color": "#FFB020",
            "peopleCount": 240,
            "sampledFrames": 5,
            "error": "File not found"
        }

    cap = cv2.VideoCapture(vpath)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 25
    duration = total_frames / fps if fps > 0 else 10.0

    sample_ratios = [0.10, 0.30, 0.50, 0.70, 0.90]
    sample_indices = [int(total_frames * p) for p in sample_ratios if int(total_frames * p) < total_frames]
    if not sample_indices:
        sample_indices = [0]

    occupancies = []
    textures = []
    diffs = []
    prev_gray = None

    for idx in sample_indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if not ret or frame is None:
            continue
        small = cv2.resize(frame, (320, 180))
        gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)

        # Spatial Laplacian texture gradient
        lap = cv2.Laplacian(gray, cv2.CV_32F)
        tex = float(np.mean(np.abs(lap)))
        textures.append(tex)

        # 16x16 block occupancy
        bs = 16
        bh, bw = 180 // bs, 320 // bs
        occ = 0
        tot = bh * bw
        for r in range(bh):
            for c in range(bw):
                block = lap[r*bs:(r+1)*bs, c*bs:(c+1)*bs]
                if np.mean(np.abs(block)) > 15.0:
                    occ += 1
        occupancies.append(occ / tot)

        if prev_gray is not None:
            diff = cv2.absdiff(gray, prev_gray)
            diffs.append(float(np.mean(diff)))
        prev_gray = gray

    cap.release()

    avg_occ = float(np.mean(occupancies)) if occupancies else 0.5
    avg_tex = float(np.mean(textures)) if textures else 30.0
    avg_diff = float(np.mean(diffs)) if diffs else 20.0

    # Calibrate normalized feature score
    tex_norm = float(np.clip((avg_tex - 20.0) / 38.0, 0.0, 1.0))
    occ_norm = float(np.clip((avg_occ - 0.50) / 0.48, 0.0, 1.0))
    combined_score = 0.55 * occ_norm + 0.45 * tex_norm

    # Meaningful density percentage (12% to 94%)
    density_pct = int(np.clip(15 + combined_score * 75, 12, 94))
    people_est = int(density_pct * 42)

    # Strictly calibrate Crowd Level, Status, Flow, Color from Density
    if density_pct <= 25:
        crowd_level = "LOW / LESS CROWD"
        color = "#00D6A3"
        status = "NORMAL"
        flow = "LIGHT CROWD MOVEMENT" if avg_diff < 40 else "STEADY FLOW"
        rec = "NO INTERVENTION REQUIRED"
        rec_sub = "Observed density is well within safe gate capacity."
        alert = "Current crowd movement is light and steady. Gate operations normal."
    elif density_pct <= 50:
        crowd_level = "MODERATE"
        color = "#FFB020"
        status = "CONTROLLED"
        flow = "STEADY INFLOW" if avg_diff < 50 else "ACTIVE CROWD MOVEMENT"
        rec = "MONITOR FLOW & BUFFER ARRIVALS"
        rec_sub = "Moderate crowd transit. Maintain regular queue pacing."
        alert = "Moderate crowd volume observed. Normal queuing protocols in effect."
    elif density_pct <= 75:
        crowd_level = "HIGH"
        color = "#f97316"
        status = "ELEVATED CROWD PRESSURE"
        flow = "ACTIVE CROWD MOVEMENT" if avg_diff > 45 else "DENSE CROWD MOVEMENT"
        rec = "REGULATE DARSHAN CONCOURSE & DIVERT TRAFFIC"
        rec_sub = "Elevated crowd concourse flow observed across sampled frames."
        alert = "High crowd movement detected. Follow designated walking lanes."
    else:
        crowd_level = "VERY HIGH"
        color = "#FF3B5C"
        status = "CRITICAL CROWD PRESSURE"
        flow = "HEAVY CROWD MOVEMENT" if avg_diff > 40 else "DENSE CROWD MOVEMENT"
        rec = "DIVERT VISITORS TOWARD ALTERNATIVE LOWER-DENSITY GATE"
        rec_sub = "Critical crowd surge occupancy detected across multiple sampled frames."
        alert = "Critical crowd pressure detected. Immediate diversion recommended."

    return {
        "density": density_pct,
        "crowdLevel": crowd_level,
        "status": status,
        "flow": flow,
        "color": color,
        "peopleCount": people_est,
        "recommendation": rec,
        "recommendationSub": rec_sub,
        "alertMessage": alert,
        "sampledFrames": len(sample_indices),
        "duration": round(duration, 1),
        "metrics": {
            "avgTexture": round(avg_tex, 2),
            "avgOccupancy": round(avg_occ, 3),
            "avgMotionFlow": round(avg_diff, 2)
        }
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No video path provided"}))
        sys.exit(1)

    path = sys.argv[1]
    result = analyze_video(path)
    print(json.dumps(result))
