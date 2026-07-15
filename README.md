# Cloud-Native Campus Incident Response and Safety Analytics Platform

A serverless AWS reference implementation for reporting, triaging and
analyzing campus safety incidents in real time.

See [docs/concept-note.md](docs/concept-note.md) for the one-page concept and
[docs/architecture.md](docs/architecture.md) for the architecture diagram,
data model and risk-scoring formula.

## Repository layout

```
template.yaml           SAM (Infrastructure as Code) template: Cognito, DynamoDB,
                         S3, API Gateway, Lambda, SNS, WAF, CloudWatch alarms
samconfig.toml           Default `sam deploy` parameters
backend/                 Lambda function source (Node.js 20.x, AWS SDK v3)
  src/lib/                Shared helpers (DynamoDB client, auth/RBAC, risk scoring, responses)
  src/functions/          One handler per Lambda
  tests/                  Unit tests for the risk-scoring engine
frontend/                React (Vite) single-page app
  src/pages/              Login/Signup, Report Incident, Dashboard, Incident Detail, Analytics
  src/context/            Cognito auth context (aws-amplify v6)
docs/                     Concept note + architecture doc
```

## Features implemented

- **Incident reporting portal** — title, description, category, severity,
  building/location, optional evidence photo uploaded directly to S3 via a
  presigned URL.
- **Automatic risk scoring & prioritization** — combines severity, category,
  a rolling 30-day "hotspot" count per building, and time-of-day into a 0-100
  score mapped to Low/Medium/High/Critical priority
  ([backend/src/lib/riskScoring.js](backend/src/lib/riskScoring.js)).
- **Real-time alert routing** — a DynamoDB Stream on the Incidents table
  drives an SNS notification whenever a High/Critical incident is created or
  an incident's status changes, decoupled from the write path.
- **Role-based access** — Cognito User Pool groups (`Admin`, `Security`,
  `Reporter`). New sign-ups are auto-assigned to `Reporter` via a
  PostConfirmation trigger; `Security`/`Admin` can triage, update status and
  view analytics.
- **Analytics dashboard** — incidents by category/status/priority, monthly
  trend, and top hotspot buildings, rendered with Recharts.
- **Security posture** — Cognito-authenticated API Gateway, IAM
  least-privilege per-function policies (SAM `DynamoDBCrudPolicy`,
  `S3CrudPolicy`, `SNSPublishMessagePolicy`), S3/DynamoDB encryption at rest,
  a regional AWS WAFv2 Web ACL (managed common rule set + rate limiting) in
  front of the API, and CloudWatch alarms on Lambda errors and DynamoDB
  throttling.

## Prerequisites

- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- Node.js 20+
- An AWS account with credentials configured (`aws configure`)

## Deploy the backend

```powershell
# from the repository root
sam build
sam deploy --guided   # first time: creates samconfig.toml overrides interactively
# subsequent deploys:
sam deploy
```

Key parameters (see `samconfig.toml`):
- `Stage` — `dev` / `staging` / `prod`
- `AlertEmail` — email address subscribed to the SNS alerts topic (you must
  confirm the subscription email AWS sends)
- `AllowedOrigin` — CORS origin for the frontend (tighten from `*` once the
  frontend is hosted)

After deploy, note the `ApiUrl`, `UserPoolId`, `UserPoolClientId` and
`EvidenceBucketName` stack outputs.

### Promoting a user to Security/Admin

New accounts land in the `Reporter` group automatically. To grant
responder/administrator access:

```powershell
aws cognito-idp admin-add-user-to-group `
  --user-pool-id <UserPoolId> `
  --username <email> `
  --group-name Security
```

## Run the frontend

```powershell
cd frontend
copy .env.example .env   # then fill in the stack outputs from `sam deploy`
npm install
npm run dev
```

For production, build with `npm run build` and host the `dist/` folder on S3
+ CloudFront (matching the proposed architecture), setting `AllowedOrigin` in
the SAM template to that CloudFront URL.

## API summary

All routes require a Cognito ID token (`Authorization` header) except where noted.

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/incidents` | Any authenticated user | Submit a new incident; computes risk score/priority |
| GET | `/incidents` | Any (Reporters see only their own) | List incidents, optional `status`/`category` filters |
| GET | `/incidents/{id}` | Owner or Security/Admin | Incident detail + status history |
| PATCH | `/incidents/{id}/status` | Security/Admin | Update status (`reported`→`acknowledged`→`in_progress`→`resolved`→`closed`) |
| POST | `/uploads/presign` | Any authenticated user | Get a presigned S3 PUT URL for evidence photos |
| GET | `/analytics/summary` | Security/Admin | Aggregated counts, monthly trend, hotspot buildings |

## Testing

```powershell
cd backend
npm install
npm test
```
