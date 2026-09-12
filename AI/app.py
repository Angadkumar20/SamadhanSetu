from flask import Flask, request, jsonify
from flask_cors import CORS

# Initialize Flask application
app = Flask(__name__)

# Enable CORS
CORS(app)

# Category-wise keywords
CATEGORY_KEYWORDS = {
    "Education": [
        "school", "teacher", "student", "college", "education", "classroom"
    ],

    "Healthcare": [
        "hospital", "doctor", "medicine", "health", "disease", "clinic"
    ],

    "Agriculture": [
        "farm", "crop", "kisan", "irrigation", "seed", "farmer"
    ],

    "Water Resources": [
        "water", "borewell", "drinking water", "river", "drought"
    ],

    "Environment": [
        "pollution", "waste", "garbage", "tree", "forest", "plastic"
    ],

    "Energy": [
        "electricity", "power cut", "solar", "energy"
    ],

    "Urban Infrastructure": [
        "road", "streetlight", "drainage", "traffic", "construction"
    ],

    "Public Administration": [
        "government office", "certificate", "corruption",
        "delay in service"
    ],

    "Rural Livelihoods": [
        "employment", "job", "income", "self-help group", "livelihood"
    ]
}


def classify_text(title: str, description: str) -> str:

    # Combine title and description
    text = f"{title or ''} {description or ''}".lower()

    # Calculate scores
    scores = {}

    for category, keywords in CATEGORY_KEYWORDS.items():
        count = sum(text.count(keyword) for keyword in keywords)
        scores[category] = count

    # Highest score
    max_score = max(scores.values())

    # No keyword matched
    if max_score == 0:
        return "Other"

    # Find categories having highest score
    top_categories = [
        category
        for category, score in scores.items()
        if score == max_score
    ]

    # Tie
    if len(top_categories) > 1:
        return "Other"

    return top_categories[0]


@app.route("/health", methods=["GET"])
def health():

    return jsonify({
        "status": "ok"
    })


@app.route("/classify", methods=["POST"])
def classify():

    # Get JSON request
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "error": "Invalid request body. Expected JSON object."
        }), 400

    # Get title and description
    title = data.get("title", "")
    description = data.get("description", "")

    # Make sure values are strings
    if not isinstance(title, str):
        title = str(title) if title is not None else ""

    if not isinstance(description, str):
        description = str(description) if description is not None else ""

    # Classification
    category = classify_text(title, description)

    # Return result
    return jsonify({
        "category": category
    })


if __name__ == "__main__":

    print("Starting SamadhanSetu AI Microservice...")
    print("Health: http://localhost:5001/health")
    print("Classification API: http://localhost:5001/classify")

    app.run(
        host="0.0.0.0",
        port=5001,
        debug=True
    )