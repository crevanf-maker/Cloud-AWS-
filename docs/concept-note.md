# Concept Note — Cloud-Native Campus Incident Response and Safety Analytics Platform

## Problem definition
Students and staff currently rely on informal channels (calls/messages) to report
incidents like safety issues, infrastructure faults, or medical needs. This causes
delayed response, missing evidence, and no reliable trend analysis.

## Motivation
A unified cloud platform can reduce response time, improve accountability, and
provide data-driven preventive action.

## Objectives
1. Build a web/mobile-friendly incident reporting portal.
2. Auto-prioritize incidents using severity and location-based risk scoring.
3. Notify responsible responders in real time.
4. Provide role-based dashboards for admin/security teams.
5. Store secure incident history for analysis and audit.

## Scope

**In scope**
1. Incident submission with photo/location/category.
2. User authentication and role-based access.
3. Alert workflow and status tracking.
4. Analytics dashboard and monthly trend reports.
5. Basic security controls (IAM, encryption, logs).

**Out of scope**
1. Integration with police/fire external systems.
2. Native iOS/Android app (web app only for LA2).
3. Advanced AI video analytics (future work).

## Proposed architecture (AWS)
1. Frontend: React web app hosted on S3 + CloudFront.
2. Authentication: Amazon Cognito (User Pool + groups for RBAC).
3. API layer: API Gateway (REST API, Cognito authorizer, WAFv2 in front).
4. Compute: AWS Lambda (incident logic, scoring, notifications).
5. Data: DynamoDB (incidents), S3 (evidence images).
6. Notifications: SNS (email/SMS alerts), event-driven via DynamoDB Streams.
7. Monitoring: CloudWatch logs/metrics/alarms.
8. Security: IAM least privilege, SSE encryption, WAF, audit logging via CloudTrail.

## Expected outcomes
1. Faster incident acknowledgment and closure tracking.
2. Transparent response workflow.
3. Actionable insights on hotspot areas/time patterns.
4. Scalable and cost-efficient architecture.

See [../README.md](../README.md) for the implemented architecture, deployment
steps and API reference.
