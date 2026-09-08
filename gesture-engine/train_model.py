import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import pickle
import warnings

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore')

print("🧠 [PHASE 2] INITIALIZING AI TRAINING PROTOCOL...")

try:
    # 1. Load the dataset you just collected
    print("Loading custom_workout_dataset.csv...")
    df = pd.read_csv('custom_workout_dataset.csv')
    
    # 2. Separate the coordinates (Features) from the exercise names (Labels)
    X = df.drop('class_label', axis=1) # The 33 joint coordinates
    y = df['class_label']              # The name of the exercise

    # 3. Split the data: 80% for training the AI, 20% for testing its accuracy
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print(f"Training AI on {len(X_train)} frames of data...")
    print(f"Classes found: {y.unique()}")

    # 4. Create and Train the Random Forest Neural Network
    model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)

    # 5. Give the AI a test to see how smart it is
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"\n✅ TRAINING COMPLETE!")
    print(f"🎯 AI Accuracy Score: {accuracy * 100:.2f}%")

    # 6. Save the trained brain to a .pkl file!
    with open('workout_model.pkl', 'wb') as f:
        pickle.dump(model, f)
        
    print("💾 Model successfully saved as 'workout_model.pkl'")
    print("You are now ready to plug this brain into gesture_engine.py!")

except FileNotFoundError:
    print("❌ ERROR: Could not find 'custom_workout_dataset.csv'. Did you run collect_data.py first?")
except Exception as e:
    print(f"❌ ERROR: {e}")
    print("Did you make sure to record at least TWO different exercises so the AI can learn the difference?")