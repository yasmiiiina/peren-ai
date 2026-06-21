from app.services.digital_twin import DigitalTwinService

def test_logic():
    # Test mapping
    form = {
        "birthDate": "1994-01-01",
        "sexAssignedAtBirth": "F",
        "weightKg": "65",
        "heightCm": "165",
        "intentions": ["Améliorer mes performances sportives"],
        "dependentsCount": "0",
        "takesPrescriptionMedication": "non",
        "hospitalizedInLastFiveYears": "non"
    }
    
    pipeline_input = DigitalTwinService.map_onboarding_to_pipeline(form)
    print(f"Mapped Input: {pipeline_input}")
    
    # Test calculation
    metrics = DigitalTwinService.calculate_metrics(pipeline_input)
    print(f"Metrics: {metrics}")
    
    assert metrics.body_age < pipeline_input["age"]  # Should be younger than chrono age
    assert metrics.body_age_state == "younger_than_chrono"
    print("Test Passed!")

if __name__ == "__main__":
    test_logic()
