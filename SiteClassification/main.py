import json
from transformers import pipeline
from tqdm import tqdm
import torch

def classify_websites_simple(input_file='websites.txt', output_file='website_categories.json'):
    device = 0 if torch.cuda.is_available() else -1
    print(f"Using device: {'GPU' if device == 0 else 'CPU'}")

    model_name = 'MoritzLaurer/deberta-v3-large-zeroshot-v2.0'
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

    labels = [
        "Productivity", "Entertainment", "Games", "Finance", "Social",
        "Shopping", "News", "Art", "Adult", "Search", "Education"
    ]
    template = 'most accurate category for website {}.'

    try:
        with open(input_file, 'r') as f:
            websites = [line.strip() for line in f if line.strip()]
        print(f"Found {len(websites)} websites to classify in '{input_file}'.")
    except FileNotFoundError:
        print(f"Error: Input file '{input_file}' not found.")
        return

    website_to_category_map = {}
    
    for site in tqdm(websites, desc="Classifying websites"):
        try:
            prediction = classifier(
                site,
                candidate_labels=labels,
                hypothesis_template=template
            )
            
            website_name = prediction['sequence']
            top_category = prediction['labels'][0] # The first label is the one with the highest score
            
            website_to_category_map[website_name] = top_category

        except Exception as e:
            print(f"\nCould not process '{site}'. Error: {e}")
            website_to_category_map[site] = "CLASSIFICATION_FAILED"

    with open(output_file, 'w') as f:
        json.dump(website_to_category_map, f, indent=4)

    print(f"\nProcessing complete. Results saved to '{output_file}'.")


if __name__ == "__main__":
    classify_websites_simple()
