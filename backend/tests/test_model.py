from ai.models.model import ask_model


def test_model_can_answer():
    response = ask_model("Say hello in one short sentence.")

    assert response.content

