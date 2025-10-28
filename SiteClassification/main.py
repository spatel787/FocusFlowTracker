import json
from transformers import pipeline
from tqdm import tqdm
import torch

def classify_websites_simple(input_file='websites.txt', output_file='website_categories.json'):
    """
    Reads websites from a file, finds the single best category for each,
    and saves the results to a simple key-value JSON file.
    """
    # ------------------- SETUP -------------------
    # Check for GPU, default to CPU if not available.
    device = 0 if torch.cuda.is_available() else -1
    print(f"Using device: {'GPU' if device == 0 else 'CPU'}")

    # Use the smaller, more efficient DistilBART model
    model_name = 'valhalla/distilbart-mnli-12-3'
    print(f"Loading the classification model: {model_name}...")
    
    try:
        classifier = pipeline(
            'zero-shot-classification',
            model=model_name,
            device=device
        )
    except Exception as e:
        print(f"Error initializing pipeline: {e}")
        return

    # Define the categories and the hypothesis template
    labels = [
        "Productivity", "Entertainment", "Games", "Finance", "Social",
        "Shopping", "Generative AI", "Education", "News", "Software",
        "Art", "Adult"
    ]
    template = 'This website is about {}.'

    # ------------------- READ INPUT -------------------
    try:
        with open(input_file, 'r') as f:
            websites = [line.strip() for line in f if line.strip()]
        print(f"Found {len(websites)} websites to classify in '{input_file}'.")
    except FileNotFoundError:
        print(f"Error: Input file '{input_file}' not found.")
        return

    # ------------------- PROCESS DATA -------------------
    # A dictionary is the perfect structure for {website: category}
    website_to_category_map = {}
    
    # Use tqdm to create a progress bar
    for site in tqdm(websites, desc="Classifying websites"):
        try:
            # When multi_label is False (default), the model finds the single best fit.
            # The output is already sorted by score, so the first label is the best one.
            prediction = classifier(
                site,
                candidate_labels=labels,
                hypothesis_template=template
            )
            
            # Extract the website name and the top category
            website_name = prediction['sequence']
            top_category = prediction['labels'][0] # The first label is the one with the highest score
            
            # Add the result to our dictionary
            website_to_category_map[website_name] = top_category

        except Exception as e:
            print(f"\nCould not process '{site}'. Error: {e}")
            website_to_category_map[site] = "CLASSIFICATION_FAILED"

    # ------------------- WRITE OUTPUT -------------------
    with open(output_file, 'w') as f:
        # Dump the entire dictionary into the JSON file with nice formatting
        json.dump(website_to_category_map, f, indent=4)

    print(f"\nProcessing complete. Results saved to '{output_file}'.")


if __name__ == "__main__":
    classify_websites_simple()
