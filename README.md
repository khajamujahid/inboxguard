# InboxGuard

Paste a subject and body. InboxGuard stamps the message **spam** or **not spam**, with a confidence score and the phrases that moved the decision.

Repo: [github.com/khajamujahid/inboxguard](https://github.com/khajamujahid/inboxguard)

Built as a live product: TF-IDF + logistic regression, a `POST /predict` API, and a public inspector UI. It never connects to Gmail or Outlook and never stores the mail you paste.

## Model

| | |
| --- | --- |
| Algorithm | TF-IDF (1–2 grams, 4,500 features) + logistic regression |
| Held-out accuracy | **98.3%** |
| F1 | **0.952** |
| Precision / recall | 0.965 / 0.940 |
| Train / test | 5,195 / 1,299 |

Dataset credit: [UCI SMS Spam Collection](https://archive.ics.uci.edu/dataset/228/sms+spam+collection) (Almeida, Hidalgo) plus a synthetic email corpus (phishing, newsletters, recruiter mail, meeting notes) so the model sees subject lines and HTML-free email, not only SMS.

## API

`POST /predict`

```json
{ "subject": "Urgent: account locked", "body": "Verify now…" }
```

```json
{
  "label": "spam",
  "confidence": 0.94,
  "reasons": [
    "Contains urgency phrases like 'act now'",
    "Mentions money / prize",
    "Suspicious link-like text"
  ]
}
```

`GET /health` returns `{ "status": "ok", "model": "tfidf-logreg", "metrics": { … } }`.

`POST /api/predict` and `GET /api/health` are aliases.

## Run locally

```bash
npm install
python3 -m pip install -r backend/requirements.txt   # only if you retrain
npm run dev
```

## Train

```bash
python3 backend/train.py          # writes src/lib/ml/model.json
python3 backend/evaluate.py       # prints accuracy / F1
```

`backend/train.py` holds out 20% of the combined corpus. On a clean split the current artifact reports **98.3% accuracy** and **F1 0.952**.

## Deploy (your own URL, not grok.me)

This is a TanStack Start app. Import the GitHub repo into [Vercel](https://vercel.com/new) (or Netlify, Fly, Railway). Build command is `npm run build`. You will get a `*.vercel.app` URL you can put on a resume.

## Out of scope (v1)

No live Gmail/Outlook, no auto-blocking, no accounts, no transformers.
