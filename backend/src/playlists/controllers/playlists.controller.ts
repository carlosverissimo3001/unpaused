import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { 
  ApiTags, 
  ApiOperation, 
  ApiCookieAuth, 
  ApiUnauthorizedResponse, 
  ApiNotFoundResponse, 
  ApiResponse
} from "@nestjs/swagger";
import { PlaylistsService } from "../services/playlists.service";
import { PlaylistsResponseDto } from "../dto/playlist-response.dto";
import { PlaylistDto } from "../dto/playlist.dto";
import { GetPlaylistsDto } from "../dto/get-playlists-dto";
import { SessionId } from "../../utils/decorators/sessionId.decorator";
import { SessionGuard } from "../../utils/guards/session-guard";

@ApiTags("Api")
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: "Not authenticated" })
@UseGuards(SessionGuard)
@Controller("playlists")
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Get("me")
  @ApiOperation({ summary: "Get current user's playlists" })
  @ApiResponse({ status: 200, type: PlaylistsResponseDto })
  async getMyPlaylists(
    @SessionId() sessionId: string,
    @Query() params: GetPlaylistsDto
  ): Promise<PlaylistsResponseDto> {
    return this.playlistsService.getMyPlaylists({ ...params, sessionId });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get playlist by ID" })
  @ApiNotFoundResponse({ description: "Playlist not found" })
  @ApiResponse({ status: 200, type: PlaylistDto })
  async getPlaylistById(
    @SessionId() sessionId: string,
    @Param("id") playlistId: string
  ): Promise<PlaylistDto> {
    return this.playlistsService.getPlaylistById(sessionId, playlistId);
  }
}