
# MessageDto


## Properties

Name | Type
------------ | -------------
`id` | string
`title` | string
`note` | string
`createdAt` | Date
`updatedAt` | Date

## Example

```typescript
import type { MessageDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": uuid,
  "title": Message Title,
  "note": Message Note,
  "createdAt": null,
  "updatedAt": null,
} satisfies MessageDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as MessageDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


