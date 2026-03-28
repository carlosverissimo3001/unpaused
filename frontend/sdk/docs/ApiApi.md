# ApiApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**adminControllerCreateStreakQuestion**](ApiApi.md#admincontrollercreatestreakquestion) | **POST** /admin/streak-questions | Create a streak quiz question |
| [**adminControllerDeleteStreakQuestion**](ApiApi.md#admincontrollerdeletestreakquestion) | **DELETE** /admin/streak-questions/{id} | Soft-delete a streak quiz question |
| [**adminControllerListStreakQuestions**](ApiApi.md#admincontrollerliststreakquestions) | **GET** /admin/streak-questions | List all streak quiz questions |
| [**adminControllerListUsers**](ApiApi.md#admincontrollerlistusers) | **GET** /admin/users | List all users |
| [**adminControllerUpdateStreakQuestion**](ApiApi.md#admincontrollerupdatestreakquestion) | **PATCH** /admin/streak-questions/{id} | Update a streak quiz question |
| [**adminControllerUpdateUserRole**](ApiApi.md#admincontrollerupdateuserrole) | **PATCH** /admin/users/{id} | Update user role flags |
| [**authControllerCallback**](ApiApi.md#authcontrollercallback) | **GET** /auth/callback | Handle Spotify OAuth callback |
| [**authControllerLogin**](ApiApi.md#authcontrollerlogin) | **GET** /auth/login | Start Spotify OAuth flow |
| [**authControllerLogout**](ApiApi.md#authcontrollerlogout) | **POST** /auth/logout | Logout and clear session |
| [**authControllerMe**](ApiApi.md#authcontrollerme) | **GET** /auth/me | Get current authenticated user |
| [**authControllerUpdateMe**](ApiApi.md#authcontrollerupdateme) | **PATCH** /auth/me | Update current user profile |
| [**gameControllerGetGameState**](ApiApi.md#gamecontrollergetgamestate) | **GET** /game/{id} | Get current game state |
| [**gameControllerGetHistory**](ApiApi.md#gamecontrollergethistory) | **GET** /game/history | Get user\&#39;s game session history (paginated) |
| [**gameControllerGetPlayedToday**](ApiApi.md#gamecontrollergetplayedtoday) | **GET** /game/daily/played-today | Whether the user has played today\&#39;s daily |
| [**gameControllerGetShare**](ApiApi.md#gamecontrollergetshare) | **GET** /game/share/{id} | Get shareable result for a game session |
| [**gameControllerGetStats**](ApiApi.md#gamecontrollergetstats) | **GET** /game/stats | Get user\&#39;s daily stats |
| [**gameControllerStartGame**](ApiApi.md#gamecontrollerstartgame) | **POST** /game/start | Start a new game from a playlist or daily |
| [**gameControllerSubmitGuess**](ApiApi.md#gamecontrollersubmitguess) | **POST** /game/{id}/guess | Submit a guess for a specific session |
| [**multiplayerControllerCreateRoom**](ApiApi.md#multiplayercontrollercreateroom) | **POST** /multiplayer/rooms | Create a new multiplayer room |
| [**multiplayerControllerGetRoomState**](ApiApi.md#multiplayercontrollergetroomstate) | **GET** /multiplayer/rooms/{id} | Get room state with players |
| [**multiplayerControllerGetRoundState**](ApiApi.md#multiplayercontrollergetroundstate) | **GET** /multiplayer/rooms/{id}/round | Get current round state for the player |
| [**multiplayerControllerGetScoreboard**](ApiApi.md#multiplayercontrollergetscoreboard) | **GET** /multiplayer/rooms/{id}/scoreboard | Get scoreboard (only completed rounds visible) |
| [**multiplayerControllerJoinRoom**](ApiApi.md#multiplayercontrollerjoinroom) | **POST** /multiplayer/rooms/{code}/join | Join a room by invite code |
| [**multiplayerControllerLeaveRoom**](ApiApi.md#multiplayercontrollerleaveroom) | **POST** /multiplayer/rooms/{id}/leave | Leave a room (host leaving expires it) |
| [**multiplayerControllerStartGame**](ApiApi.md#multiplayercontrollerstartgame) | **POST** /multiplayer/rooms/{id}/start | Start the game (host only) |
| [**multiplayerControllerSubmitGuess**](ApiApi.md#multiplayercontrollersubmitguess) | **POST** /multiplayer/rooms/{id}/guess | Submit a guess for the current round |
| [**multiplayerControllerToggleReady**](ApiApi.md#multiplayercontrollertoggleready) | **POST** /multiplayer/rooms/{id}/ready | Toggle ready status for current player |
| [**playlistControllerGetMyPlaylists**](ApiApi.md#playlistcontrollergetmyplaylists) | **GET** /playlists/me | Get current user\&#39;s playlists |
| [**playlistControllerGetPlaylistById**](ApiApi.md#playlistcontrollergetplaylistbyid) | **GET** /playlists/{id} | Get playlist by ID |
| [**searchControllerSearchTracks**](ApiApi.md#searchcontrollersearchtracks) | **GET** /search/tracks | Search Spotify tracks (for game guess options) |
| [**streakControllerGetNextQuestion**](ApiApi.md#streakcontrollergetnextquestion) | **GET** /streak/quiz/next | Get the next unanswered quiz question |
| [**streakControllerGetStatus**](ApiApi.md#streakcontrollergetstatus) | **GET** /streak/status | Get streak status including freeze info |
| [**streakControllerSubmitAnswer**](ApiApi.md#streakcontrollersubmitanswer) | **POST** /streak/quiz/answer | Submit a quiz answer to earn a streak freeze |
| [**streakControllerUseFreeze**](ApiApi.md#streakcontrollerusefreeze) | **POST** /streak/use-freeze | Apply streak freezes to bridge a gap |
| [**userAvatarControllerUpdateSource**](ApiApi.md#useravatarcontrollerupdatesource) | **PATCH** /user-avatar/source | Switch between Spotify and custom avatar |
| [**userAvatarControllerUpload**](ApiApi.md#useravatarcontrollerupload) | **POST** /user-avatar/upload | Upload a custom avatar image |
| [**userPreferencesControllerGet**](ApiApi.md#userpreferencescontrollerget) | **GET** /user-preferences | Get user preferences |
| [**userPreferencesControllerUpdate**](ApiApi.md#userpreferencescontrollerupdate) | **PATCH** /user-preferences | Update user preferences |



## adminControllerCreateStreakQuestion

> StreakQuestionDto adminControllerCreateStreakQuestion(createStreakQuestionDto)

Create a streak quiz question

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { AdminControllerCreateStreakQuestionRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // CreateStreakQuestionDto
    createStreakQuestionDto: ...,
  } satisfies AdminControllerCreateStreakQuestionRequest;

  try {
    const data = await api.adminControllerCreateStreakQuestion(body);
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
| **createStreakQuestionDto** | [CreateStreakQuestionDto](CreateStreakQuestionDto.md) |  | |

### Return type

[**StreakQuestionDto**](StreakQuestionDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminControllerDeleteStreakQuestion

> adminControllerDeleteStreakQuestion(id)

Soft-delete a streak quiz question

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { AdminControllerDeleteStreakQuestionRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies AdminControllerDeleteStreakQuestionRequest;

  try {
    const data = await api.adminControllerDeleteStreakQuestion(body);
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
| **204** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminControllerListStreakQuestions

> Array&lt;StreakQuestionDto&gt; adminControllerListStreakQuestions()

List all streak quiz questions

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { AdminControllerListStreakQuestionsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  try {
    const data = await api.adminControllerListStreakQuestions();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**Array&lt;StreakQuestionDto&gt;**](StreakQuestionDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminControllerListUsers

> Array&lt;AdminUserDto&gt; adminControllerListUsers()

List all users

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { AdminControllerListUsersRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  try {
    const data = await api.adminControllerListUsers();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**Array&lt;AdminUserDto&gt;**](AdminUserDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminControllerUpdateStreakQuestion

> StreakQuestionDto adminControllerUpdateStreakQuestion(id, updateStreakQuestionDto)

Update a streak quiz question

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { AdminControllerUpdateStreakQuestionRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string
    id: id_example,
    // UpdateStreakQuestionDto
    updateStreakQuestionDto: ...,
  } satisfies AdminControllerUpdateStreakQuestionRequest;

  try {
    const data = await api.adminControllerUpdateStreakQuestion(body);
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
| **updateStreakQuestionDto** | [UpdateStreakQuestionDto](UpdateStreakQuestionDto.md) |  | |

### Return type

[**StreakQuestionDto**](StreakQuestionDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## adminControllerUpdateUserRole

> AdminUserDto adminControllerUpdateUserRole(id, updateUserRoleDto)

Update user role flags

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { AdminControllerUpdateUserRoleRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string
    id: id_example,
    // UpdateUserRoleDto
    updateUserRoleDto: ...,
  } satisfies AdminControllerUpdateUserRoleRequest;

  try {
    const data = await api.adminControllerUpdateUserRole(body);
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
| **updateUserRoleDto** | [UpdateUserRoleDto](UpdateUserRoleDto.md) |  | |

### Return type

[**AdminUserDto**](AdminUserDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## authControllerCallback

> authControllerCallback(code, state, error)

Handle Spotify OAuth callback

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { AuthControllerCallbackRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new ApiApi();

  const body = {
    // string | Authorization code from Spotify
    code: code_example,
    // string | State parameter for CSRF protection
    state: state_example,
    // object | Error message if authorization failed. (optional)
    error: Object,
  } satisfies AuthControllerCallbackRequest;

  try {
    const data = await api.authControllerCallback(body);
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
| **code** | `string` | Authorization code from Spotify | [Defaults to `undefined`] |
| **state** | `string` | State parameter for CSRF protection | [Defaults to `undefined`] |
| **error** | `object` | Error message if authorization failed. | [Optional] [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **302** | Redirects to frontend after auth |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## authControllerLogin

> authControllerLogin()

Start Spotify OAuth flow

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { AuthControllerLoginRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new ApiApi();

  try {
    const data = await api.authControllerLogin();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **302** | Redirects to Spotify authorization |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## authControllerLogout

> authControllerLogout()

Logout and clear session

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { AuthControllerLogoutRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  try {
    const data = await api.authControllerLogout();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

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
| **200** | Successfully logged out |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## authControllerMe

> AuthMeResponseDto authControllerMe()

Get current authenticated user

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { AuthControllerMeRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  try {
    const data = await api.authControllerMe();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**AuthMeResponseDto**](AuthMeResponseDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## authControllerUpdateMe

> AuthMeResponseDto authControllerUpdateMe(patchUserDto)

Update current user profile

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { AuthControllerUpdateMeRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // PatchUserDto
    patchUserDto: ...,
  } satisfies AuthControllerUpdateMeRequest;

  try {
    const data = await api.authControllerUpdateMe(body);
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
| **patchUserDto** | [PatchUserDto](PatchUserDto.md) |  | |

### Return type

[**AuthMeResponseDto**](AuthMeResponseDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## gameControllerGetGameState

> GameStateDto gameControllerGetGameState(id)

Get current game state

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { GameControllerGetGameStateRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string | The internal Game Session UUID
    id: id_example,
  } satisfies GameControllerGetGameStateRequest;

  try {
    const data = await api.gameControllerGetGameState(body);
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
| **id** | `string` | The internal Game Session UUID | [Defaults to `undefined`] |

### Return type

[**GameStateDto**](GameStateDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## gameControllerGetHistory

> GameHistoryDto gameControllerGetHistory(mode, page, limit, search, status, from, to)

Get user\&#39;s game session history (paginated)

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { GameControllerGetHistoryRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // 'DAILY' | 'ALL' | 'MULTIPLAYER' | The game mode to filter history by (e.g. daily, all) (optional)
    mode: mode_example,
    // number | Page number (1-indexed) (optional)
    page: 8.14,
    // number | Items per page (optional)
    limit: 8.14,
    // string | Search by track name, artist name, or album name (optional)
    search: search_example,
    // Array<'PLAYING' | 'WON' | 'LOST' | 'ABANDONED'> | Filter by game status (optional)
    status: ...,
    // Date | Filter from date (ISO 8601) (optional)
    from: 2013-10-20T19:20:30+01:00,
    // Date | Filter to date (ISO 8601) (optional)
    to: 2013-10-20T19:20:30+01:00,
  } satisfies GameControllerGetHistoryRequest;

  try {
    const data = await api.gameControllerGetHistory(body);
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
| **mode** | `DAILY`, `ALL`, `MULTIPLAYER` | The game mode to filter history by (e.g. daily, all) | [Optional] [Defaults to `undefined`] [Enum: DAILY, ALL, MULTIPLAYER] |
| **page** | `number` | Page number (1-indexed) | [Optional] [Defaults to `1`] |
| **limit** | `number` | Items per page | [Optional] [Defaults to `10`] |
| **search** | `string` | Search by track name, artist name, or album name | [Optional] [Defaults to `undefined`] |
| **status** | `PLAYING`, `WON`, `LOST`, `ABANDONED` | Filter by game status | [Optional] [Enum: PLAYING, WON, LOST, ABANDONED] |
| **from** | `Date` | Filter from date (ISO 8601) | [Optional] [Defaults to `undefined`] |
| **to** | `Date` | Filter to date (ISO 8601) | [Optional] [Defaults to `undefined`] |

### Return type

[**GameHistoryDto**](GameHistoryDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## gameControllerGetPlayedToday

> PlayedTodayDto gameControllerGetPlayedToday()

Whether the user has played today\&#39;s daily

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { GameControllerGetPlayedTodayRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  try {
    const data = await api.gameControllerGetPlayedToday();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**PlayedTodayDto**](PlayedTodayDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## gameControllerGetShare

> ShareResultDto gameControllerGetShare(id)

Get shareable result for a game session

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { GameControllerGetShareRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string | Game session ID
    id: id_example,
  } satisfies GameControllerGetShareRequest;

  try {
    const data = await api.gameControllerGetShare(body);
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
| **id** | `string` | Game session ID | [Defaults to `undefined`] |

### Return type

[**ShareResultDto**](ShareResultDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## gameControllerGetStats

> GameStatsDto gameControllerGetStats(mode)

Get user\&#39;s daily stats

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { GameControllerGetStatsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // 'DAILY' | 'ALL' | 'MULTIPLAYER' | The game mode
    mode: mode_example,
  } satisfies GameControllerGetStatsRequest;

  try {
    const data = await api.gameControllerGetStats(body);
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
| **mode** | `DAILY`, `ALL`, `MULTIPLAYER` | The game mode | [Defaults to `undefined`] [Enum: DAILY, ALL, MULTIPLAYER] |

### Return type

[**GameStatsDto**](GameStatsDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## gameControllerStartGame

> GameStateDto gameControllerStartGame(startGameDto)

Start a new game from a playlist or daily

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { GameControllerStartGameRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // StartGameDto
    startGameDto: ...,
  } satisfies GameControllerStartGameRequest;

  try {
    const data = await api.gameControllerStartGame(body);
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
| **startGameDto** | [StartGameDto](StartGameDto.md) |  | |

### Return type

[**GameStateDto**](GameStateDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## gameControllerSubmitGuess

> GuessResultDto gameControllerSubmitGuess(id, guessDto)

Submit a guess for a specific session

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { GameControllerSubmitGuessRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new ApiApi();

  const body = {
    // string | The internal Game Session UUID
    id: id_example,
    // GuessDto
    guessDto: ...,
  } satisfies GameControllerSubmitGuessRequest;

  try {
    const data = await api.gameControllerSubmitGuess(body);
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
| **id** | `string` | The internal Game Session UUID | [Defaults to `undefined`] |
| **guessDto** | [GuessDto](GuessDto.md) |  | |

### Return type

[**GuessResultDto**](GuessResultDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **429** | Rate limit exceeded |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## multiplayerControllerCreateRoom

> RoomDto multiplayerControllerCreateRoom(createRoomDto)

Create a new multiplayer room

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { MultiplayerControllerCreateRoomRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // CreateRoomDto
    createRoomDto: ...,
  } satisfies MultiplayerControllerCreateRoomRequest;

  try {
    const data = await api.multiplayerControllerCreateRoom(body);
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
| **createRoomDto** | [CreateRoomDto](CreateRoomDto.md) |  | |

### Return type

[**RoomDto**](RoomDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## multiplayerControllerGetRoomState

> RoomDto multiplayerControllerGetRoomState(id)

Get room state with players

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { MultiplayerControllerGetRoomStateRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string | Room ID
    id: id_example,
  } satisfies MultiplayerControllerGetRoomStateRequest;

  try {
    const data = await api.multiplayerControllerGetRoomState(body);
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
| **id** | `string` | Room ID | [Defaults to `undefined`] |

### Return type

[**RoomDto**](RoomDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## multiplayerControllerGetRoundState

> MultiplayerRoundStateDto multiplayerControllerGetRoundState(id)

Get current round state for the player

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { MultiplayerControllerGetRoundStateRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string | Room ID
    id: id_example,
  } satisfies MultiplayerControllerGetRoundStateRequest;

  try {
    const data = await api.multiplayerControllerGetRoundState(body);
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
| **id** | `string` | Room ID | [Defaults to `undefined`] |

### Return type

[**MultiplayerRoundStateDto**](MultiplayerRoundStateDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## multiplayerControllerGetScoreboard

> ScoreboardDto multiplayerControllerGetScoreboard(id)

Get scoreboard (only completed rounds visible)

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { MultiplayerControllerGetScoreboardRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string | Room ID
    id: id_example,
  } satisfies MultiplayerControllerGetScoreboardRequest;

  try {
    const data = await api.multiplayerControllerGetScoreboard(body);
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
| **id** | `string` | Room ID | [Defaults to `undefined`] |

### Return type

[**ScoreboardDto**](ScoreboardDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## multiplayerControllerJoinRoom

> RoomDto multiplayerControllerJoinRoom(code)

Join a room by invite code

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { MultiplayerControllerJoinRoomRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string | Room invite code
    code: code_example,
  } satisfies MultiplayerControllerJoinRoomRequest;

  try {
    const data = await api.multiplayerControllerJoinRoom(body);
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
| **code** | `string` | Room invite code | [Defaults to `undefined`] |

### Return type

[**RoomDto**](RoomDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## multiplayerControllerLeaveRoom

> multiplayerControllerLeaveRoom(id)

Leave a room (host leaving expires it)

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { MultiplayerControllerLeaveRoomRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string | Room ID
    id: id_example,
  } satisfies MultiplayerControllerLeaveRoomRequest;

  try {
    const data = await api.multiplayerControllerLeaveRoom(body);
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
| **id** | `string` | Room ID | [Defaults to `undefined`] |

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
| **204** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## multiplayerControllerStartGame

> RoomDto multiplayerControllerStartGame(id)

Start the game (host only)

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { MultiplayerControllerStartGameRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string | Room ID
    id: id_example,
  } satisfies MultiplayerControllerStartGameRequest;

  try {
    const data = await api.multiplayerControllerStartGame(body);
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
| **id** | `string` | Room ID | [Defaults to `undefined`] |

### Return type

[**RoomDto**](RoomDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## multiplayerControllerSubmitGuess

> GuessResultDto multiplayerControllerSubmitGuess(id, guessDto)

Submit a guess for the current round

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { MultiplayerControllerSubmitGuessRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string | Room ID
    id: id_example,
    // GuessDto
    guessDto: ...,
  } satisfies MultiplayerControllerSubmitGuessRequest;

  try {
    const data = await api.multiplayerControllerSubmitGuess(body);
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
| **id** | `string` | Room ID | [Defaults to `undefined`] |
| **guessDto** | [GuessDto](GuessDto.md) |  | |

### Return type

[**GuessResultDto**](GuessResultDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **429** | Rate limit exceeded |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## multiplayerControllerToggleReady

> RoomDto multiplayerControllerToggleReady(id)

Toggle ready status for current player

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { MultiplayerControllerToggleReadyRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string | Room ID
    id: id_example,
  } satisfies MultiplayerControllerToggleReadyRequest;

  try {
    const data = await api.multiplayerControllerToggleReady(body);
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
| **id** | `string` | Room ID | [Defaults to `undefined`] |

### Return type

[**RoomDto**](RoomDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## playlistControllerGetMyPlaylists

> PlaylistsResponseDto playlistControllerGetMyPlaylists(limit, offset, onlyPublic, onlyPrivate, sortBy)

Get current user\&#39;s playlists

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { PlaylistControllerGetMyPlaylistsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // number (optional)
    limit: 20,
    // number (optional)
    offset: 0,
    // boolean | Include only public playlists (optional)
    onlyPublic: true,
    // boolean | Include only private playlists (optional)
    onlyPrivate: true,
    // 'default' | 'name' | 'tracks' | Sort playlists by field (optional)
    sortBy: sortBy_example,
  } satisfies PlaylistControllerGetMyPlaylistsRequest;

  try {
    const data = await api.playlistControllerGetMyPlaylists(body);
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
| **onlyPublic** | `boolean` | Include only public playlists | [Optional] [Defaults to `undefined`] |
| **onlyPrivate** | `boolean` | Include only private playlists | [Optional] [Defaults to `undefined`] |
| **sortBy** | `default`, `name`, `tracks` | Sort playlists by field | [Optional] [Defaults to `undefined`] [Enum: default, name, tracks] |

### Return type

[**PlaylistsResponseDto**](PlaylistsResponseDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **401** | Not authenticated |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## playlistControllerGetPlaylistById

> PlaylistDto playlistControllerGetPlaylistById(id)

Get playlist by ID

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { PlaylistControllerGetPlaylistByIdRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies PlaylistControllerGetPlaylistByIdRequest;

  try {
    const data = await api.playlistControllerGetPlaylistById(body);
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

[**PlaylistDto**](PlaylistDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **401** | Not authenticated |  -  |
| **404** | Playlist not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## searchControllerSearchTracks

> Array&lt;TrackOptionDto&gt; searchControllerSearchTracks(q)

Search Spotify tracks (for game guess options)

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { SearchControllerSearchTracksRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // string
    q: q_example,
  } satisfies SearchControllerSearchTracksRequest;

  try {
    const data = await api.searchControllerSearchTracks(body);
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
| **q** | `string` |  | [Defaults to `undefined`] |

### Return type

[**Array&lt;TrackOptionDto&gt;**](TrackOptionDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Track options |  -  |
| **401** | Not authenticated |  -  |
| **429** | Rate limit exceeded |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## streakControllerGetNextQuestion

> QuizNextResponseDto streakControllerGetNextQuestion()

Get the next unanswered quiz question

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { StreakControllerGetNextQuestionRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  try {
    const data = await api.streakControllerGetNextQuestion();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**QuizNextResponseDto**](QuizNextResponseDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## streakControllerGetStatus

> StreakStatusDto streakControllerGetStatus()

Get streak status including freeze info

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { StreakControllerGetStatusRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  try {
    const data = await api.streakControllerGetStatus();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**StreakStatusDto**](StreakStatusDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## streakControllerSubmitAnswer

> QuizResultDto streakControllerSubmitAnswer(submitQuizAnswerDto)

Submit a quiz answer to earn a streak freeze

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { StreakControllerSubmitAnswerRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // SubmitQuizAnswerDto
    submitQuizAnswerDto: ...,
  } satisfies StreakControllerSubmitAnswerRequest;

  try {
    const data = await api.streakControllerSubmitAnswer(body);
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
| **submitQuizAnswerDto** | [SubmitQuizAnswerDto](SubmitQuizAnswerDto.md) |  | |

### Return type

[**QuizResultDto**](QuizResultDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## streakControllerUseFreeze

> StreakStatusDto streakControllerUseFreeze()

Apply streak freezes to bridge a gap

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { StreakControllerUseFreezeRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  try {
    const data = await api.streakControllerUseFreeze();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**StreakStatusDto**](StreakStatusDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## userAvatarControllerUpdateSource

> UploadAvatarResponseDto userAvatarControllerUpdateSource(updateAvatarSourceDto)

Switch between Spotify and custom avatar

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { UserAvatarControllerUpdateSourceRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // UpdateAvatarSourceDto
    updateAvatarSourceDto: ...,
  } satisfies UserAvatarControllerUpdateSourceRequest;

  try {
    const data = await api.userAvatarControllerUpdateSource(body);
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
| **updateAvatarSourceDto** | [UpdateAvatarSourceDto](UpdateAvatarSourceDto.md) |  | |

### Return type

[**UploadAvatarResponseDto**](UploadAvatarResponseDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## userAvatarControllerUpload

> UploadAvatarResponseDto userAvatarControllerUpload(file)

Upload a custom avatar image

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { UserAvatarControllerUploadRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // Blob
    file: BINARY_DATA_HERE,
  } satisfies UserAvatarControllerUploadRequest;

  try {
    const data = await api.userAvatarControllerUpload(body);
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
| **file** | `Blob` |  | [Defaults to `undefined`] |

### Return type

[**UploadAvatarResponseDto**](UploadAvatarResponseDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: `multipart/form-data`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## userPreferencesControllerGet

> UserPreferenceDto userPreferencesControllerGet()

Get user preferences

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { UserPreferencesControllerGetRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  try {
    const data = await api.userPreferencesControllerGet();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**UserPreferenceDto**](UserPreferenceDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## userPreferencesControllerUpdate

> UserPreferenceDto userPreferencesControllerUpdate(updateUserPreferenceDto)

Update user preferences

### Example

```ts
import {
  Configuration,
  ApiApi,
} from '';
import type { UserPreferencesControllerUpdateRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new ApiApi(config);

  const body = {
    // UpdateUserPreferenceDto
    updateUserPreferenceDto: ...,
  } satisfies UserPreferencesControllerUpdateRequest;

  try {
    const data = await api.userPreferencesControllerUpdate(body);
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
| **updateUserPreferenceDto** | [UpdateUserPreferenceDto](UpdateUserPreferenceDto.md) |  | |

### Return type

[**UserPreferenceDto**](UserPreferenceDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

