def select_assigned_prediction(probabilities, classes, expected):
    if len(probabilities) != len(classes):
        raise ValueError("Workout probabilities must match the model classes.")
    if len(classes) == 0:
        return "SCANNING", 0.0

    overall_confidence = max(float(probability) for probability in probabilities)
    if overall_confidence < 0.45:
        return "SCANNING", overall_confidence

    assigned_predictions = [
        (float(probability), str(label).upper())
        for probability, label in zip(probabilities, classes)
        if str(label).upper() in expected
    ]
    if not assigned_predictions:
        return "WAITING", overall_confidence

    target_confidence, target_prediction = max(assigned_predictions, key=lambda item: item[0])
    if target_confidence < 0.45:
        return "WAITING", overall_confidence

    return target_prediction, target_confidence
