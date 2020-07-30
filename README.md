# serverless-mongo-proxy

A serverless plugin that creates a mongodb proxy

## Installation

Install via npm in the root of your Serverless service:
```sh
npm install serverless-mongo-proxy
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

## Environment Variables

#### Mongodb
Mongodb endpoint and database name can be set respectively through the environment variables
`MONGO_URI` and `MONGO_DB_NAME` or under the custom section of your Serverless `serverless.yaml`:
```yaml
custom:
  mongo-proxy:
    mongoUri: 'mongodb://localhost:27017'
    mongoDbName: 'myDatabase'
```

#### Stage name
Stage name can be set under the provider section of your Serverless `serverless.yaml`:
```yaml
provider:
  stage: 'dev'
```
or through the environment variable `STAGE_NAME` 

Note: all variables can be set also through a .env file

## Additional proxy function fields
Other fields can be specified under `functionFields`.

For example to use the plugin with serverless-plugin-warmup add these fields on your
Serverless `serverless.yaml`:
```yaml
custom:
  mongo-proxy:
    functionFields:
      warmup:
        enabled: true
```
