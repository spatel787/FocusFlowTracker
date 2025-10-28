from transformers import pipeline

classifier = pipeline('zero-shot-classification', model = 'facebook/bart-large-mnli')

labels = ["Productivity", "Entertainment", "Games", "Social Networking", "Shopping", "Generative AI", "Other"]
template = 'What type of site is this? {}.'
website = "google.com"

prediction = classifier(website, labels, hypothesis_template=template, multi_class=True)

print(prediction)

