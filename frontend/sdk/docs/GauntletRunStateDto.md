
# GauntletRunStateDto


## Properties

Name | Type
------------ | -------------
`runId` | string
`score` | number
`status` | string
`difficulty` | string
`previewUrl` | string
`snippetDuration` | number

## Example

```typescript
import type { GauntletRunStateDto } from ''

// TODO: Update the object below with actual values
const example = {
  "runId": null,
  "score": null,
  "status": null,
  "difficulty": null,
  "previewUrl": null,
  "snippetDuration": null,
} satisfies GauntletRunStateDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as GauntletRunStateDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


