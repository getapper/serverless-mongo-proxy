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

## Custom parameters
It is possible to specify custom parameters via the following object:
```yaml
custom:
  mongo-proxy:
    mongoUri: 'mongodb://localhost:27017'
    mongoDbName: 'myDatabase'
```
If different configuration is needed between different stages, it is possible to specify stage-specific custom objects:
```yaml
custom:
  mongo-proxy-prod:
    functionFields:
      vpc:
        securityGroupIds:
          - sg-xxxxxxxx
        subnetIds:
          - subnet-xxxxxxxx
          - subnet-xxxxxxxx
```
```yaml
custom:
  mongo-proxy-dev:
    mongoUri: 'mongodb://localhost:27017'
    mongoDbName: 'myDatabase'
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

#### VPC configuration
If you need to put the proxy inside a VPC, for example to work with Mongo Atlas after a [Peering connection](https://docs.atlas.mongodb.com/security-vpc-peering/), you can use:
```yaml
custom:
  mongo-proxy-prod:
    functionFields:
      vpc:
        securityGroupIds:
          - sg-xxxxxxxx
        subnetIds:
          - subnet-xxxxxxxx
          - subnet-xxxxxxxx
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
  Payload: JSON.stringify({ requestBufferValues }),
}).then(...)
```
see [aws docs](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html#invoke-property) for details.

#### Payload
The proxy uses [bson](https://www.npmjs.com/package/bson) to serialize/deserialize data between the proxy itself
and the caller.

The expected _stringified_ payload has shape: `{ requestBufferValues: number[] }` where `number[]`
contains the values of the buffer representing the request, serialized using bson.

Example: `const requestBufferValues = Array.from(bson.serialize({...}).values())` 

###### Proxy Request
The actual proxy request has shape:

```typescript
interface ProxyRequest {
  collectionName: string
  operation: string // a mongodb operation (find, insert...)
  args: any[]
}
```

###### Proxy Response
The proxy response has shape:

```typescript
interface ProxyResponse {
  responseBufferValues?: number[]
  error?: string
}
```

#### Full example
```js
const { Lambda } = require('aws-sdk')
const Bson = require('bson')
...
const lambda = new Lambda()
const proxyRequest = {
  collectionName: 'test-collection',
  operation: 'insertOne',
  args: [{ name: 'Arthur', surname: 'Dent' }]
}
const bufferValues = Array.from(bson.serialize(proxyRequest).values())
lambda.invoke({
  FunctionName: `${serviceName}-${stage}-_serverless-mongo-proxy`,
  InvocationType: 'RequestResponse',
  Payload: JSON.stringify({ requestBufferValues }),
}).then(response => {
  const { requestBufferValues, error } = response
  const { result } = bson.deserialize(Buffer.from(requestBufferValues))
  console.log(result.insertedCount) // output: 1
})
```

Note: the deserialized payload has shape `{ result: any }` and represents the mongodb operation result

See [@restlessness/dao-mongo](https://www.npmjs.com/package/@restlessness/dao-mongo) package for an example of usage.
