import os
import pickle
import sys
import warnings

import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split

warnings.filterwarnings('ignore')

# Allow the emoji progress messages on Windows consoles and pipes.
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(SCRIPT_DIR)
sys.path.insert(0, BASE_DIR)

from pose_features import FEATURE_VERSION, NUM_FEATURES, scale_by_torso  # noqa: E402

DATASET_PATH = os.path.join(BASE_DIR, 'datasets', 'custom_workout_dataset.csv')
if not os.path.exists(DATASET_PATH):
    DATASET_PATH = os.path.join(BASE_DIR, 'custom_workout_dataset.csv')

MODEL_OUTPUT_DIR = os.path.join(BASE_DIR, 'models')
os.makedirs(MODEL_OUTPUT_DIR, exist_ok=True)
MODEL_OUTPUT_PATH = os.path.join(MODEL_OUTPUT_DIR, 'workout_model.pkl')

print("🧠 [PHASE 2] INITIALIZING AI TRAINING PROTOCOL...")

try:
    # 1. Load the dataset (rows are nose-relative landmarks, feature version 1)
    print(f"Loading dataset from '{DATASET_PATH}'...")
    df = pd.read_csv(DATASET_PATH)

    X_raw = df.drop('class_label', axis=1).to_numpy(dtype='float32')
    y = df['class_label'].astype(str).str.upper().to_numpy()
    if X_raw.shape[1] != NUM_FEATURES:
        raise ValueError(f"Expected {NUM_FEATURES} landmark columns, found {X_raw.shape[1]}.")

    # 2. Scale every skeleton by its torso length so the distance from the
    #    camera no longer changes the features (must match the live engine).
    X = scale_by_torso(X_raw)

    print("Frames per exercise:")
    print(pd.Series(y).value_counts().to_string())

    # 3. Hold out 20% for testing, keeping each exercise's share the same.
    #    NOTE: frames from the same recording are very similar, so this score
    #    is optimistic. Record separate people for a test set to get a real one.
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y,
    )

    print(f"\nTraining AI on {len(X_train)} frames of data...")

    # 4. class_weight='balanced' stops exercises with many frames (burpee: 29)
    #    from drowning out ones with few (crunch: 6).
    model = RandomForestClassifier(
        n_estimators=200,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    # 5. Test it
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\n✅ TRAINING COMPLETE!")
    print(f"🎯 AI Accuracy Score: {accuracy * 100:.2f}%")
    print(classification_report(y_test, y_pred, zero_division=0))

    # 6. Retrain on all data for the saved model, and record the feature
    #    format so the engine builds matching features.
    model.fit(X, y)
    model.feature_version_ = FEATURE_VERSION

    with open(MODEL_OUTPUT_PATH, 'wb') as f:
        pickle.dump(model, f)

    print(f"💾 Model (feature version {FEATURE_VERSION}) saved to '{MODEL_OUTPUT_PATH}'")
    print("Restart the Gesture Engine to load it.")

except FileNotFoundError:
    print(f"❌ ERROR: Could not find dataset at '{DATASET_PATH}'. Did you run collect_data.py first?")
except Exception as e:
    print(f"❌ ERROR: {e}")
    print("Did you make sure to record at least TWO different exercises so the AI can learn the difference?")
