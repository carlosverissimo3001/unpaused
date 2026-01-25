# PlaylistsApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**playlistsControllerGetMyPlaylists**](PlaylistsApi.md#playlistscontrollergetmyplaylists) | **GET** /playlists/me | Get current user\&#39;s playlists |
| [**playlistsControllerGetPlaylistById**](PlaylistsApi.md#playlistscontrollergetplaylistbyid) | **GET** /playlists/{id} | Get playlist by ID |



## playlistsControllerGetMyPlaylists

> playlistsControllerGetMyPlaylists(limit, offset, includePrivate, onlyUserOwned)

Get current user\&#39;s playlists

### Example

```ts
import {
  Configuration,
  PlaylistsApi,
} from '';
import type { PlaylistsControllerGetMyPlaylistsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new PlaylistsApi(config);

  const body = {
    // number (optional)
    limit: 20,
    // number (optional)
    offset: 0,
    // boolean (optional)
    includePrivate: false,
    // boolean (optional)
    onlyUserOwned: false,
  } satisfies PlaylistsControllerGetMyPlaylistsRequest;

  try {
    const data = await api.playlistsControllerGetMyPlaylists(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **limit** | `number` |  | [Optional] [Defaults to `undefined`] |
| **offset** | `number` |  | [Optional] [Defaults to `undefined`] |
| **includePrivate** | `boolean` |  | [Optional] [Defaults to `false`] |
| **onlyUserOwned** | `boolean` |  | [Optional] [Defaults to `false`] |

### Return type

`void` (Empty response body)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **401** | Not authenticated |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## playlistsControllerGetPlaylistById

> playlistsControllerGetPlaylistById(id)

Get playlist by ID

### Example

```ts
import {
  Configuration,
  PlaylistsApi,
} from '';
import type { PlaylistsControllerGetPlaylistByIdRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new PlaylistsApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies PlaylistsControllerGetPlaylistByIdRequest;

  try {
    const data = await api.playlistsControllerGetPlaylistById(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` |  | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **401** | Not authenticated |  -  |
| **404** | Playlist not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

