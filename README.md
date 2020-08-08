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

## Usage
The plugin creates a lambda function that can be invoked through the aws-sdk:
```js
const { Lambda } = require('aws-sdk')
...
const lambda = new Lambda()
lambda.invoke({
  FunctionName: `${serviceName}-${stage}-_serverless-mongo-proxy`,
  InvocationType: 'RequestResponse',
  Payload: JSON.stringify({ bufferValues }),
}).then(...)
```
see [aws docs](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html#invoke-property) for details.

#### Payload
The proxy uses [bson](https://www.npmjs.com/package/bson) to serialize/deserialize data between the proxy itself
and the caller.

The expected payload (_stringified_) has shape: `Payload: { bufferValues: number[] }` where `number[]`
contains the values of the buffer representing the request, serialized using bson.

Example: `const bufferValues = Array.from(bson.serialize({...}).values())` 

###### Proxy Request
The actual proxy request has shape:

```typescript
interface ProxyRequest {
  collectionName: string
  operation: string // a mongodb operation (find, insert...)
  args: any[]
}
```

#### Full example
```js
const { Lambda } = require('aws-sdk')
...
const lambda = new Lambda()
const proxyRequest = {
  collectionName: 'test-collection',
  operation: 'insertOne',
  args: [{ name: 'Arthur', surname: 'Dent' }]
}
const bufferValues = Array.from(bson.serialize({proxyRequest}).values())
lambda.invoke({
  FunctionName: `${serviceName}-${stage}-_serverless-mongo-proxy`,
  InvocationType: 'RequestResponse',
  Payload: JSON.stringify({ bufferValues }),
}).then(result => {
  console.log(result.insertedCount) // output: 1
})
```

See [@restlessness/dao-mongo](https://www.npmjs.com/package/@restlessness/dao-mongo) package for an example of usage.
