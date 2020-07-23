# serverless-mongo-proxy

A serverless plugin that creates a mongodb proxy

## Installation

Install via npm in the root of your Serverless service:
```sh
npm install --save-dev serverless-mongo-proxy
```

Add the plugin to the `plugins` array in your Serverless `serverless.yaml`:
```yaml
plugins:
  - serverless-mongo-proxy  # add before serverless-offline if present
```

Add Lambda invoke permissions in your Serverless `serverless.yaml`:
```yaml
provider:
  iamRoleStatements:
    - Effect: Allow
      Action:
        - lambda:InvokeFunction
      Resource: '*'
```
