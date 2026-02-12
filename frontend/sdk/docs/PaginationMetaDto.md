
# PaginationMetaDto


## Properties

Name | Type
------------ | -------------
`totalItems` | number
`itemCount` | number
`itemsPerPage` | number
`totalPages` | number
`currentPage` | number

## Example

```typescript
import type { PaginationMetaDto } from ''

// TODO: Update the object below with actual values
const example = {
  "totalItems": null,
  "itemCount": null,
  "itemsPerPage": null,
  "totalPages": null,
  "currentPage": null,
} satisfies PaginationMetaDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PaginationMetaDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


