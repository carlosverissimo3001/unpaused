import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiCookieAuth,
} from "@nestjs/swagger";
import { Request } from "express";
import { PlaylistsService } from "./playlists.service";
import { PlaylistsResponseDto } from "./dto/playlist.dto";
import { PlaylistDetailsDto } from "./dto/playlist-details.dto";

const SESSION_COOKIE_NAME = "unpaused_session";

@ApiTags("Playlists")
@ApiCookieAuth()
@Controller("playlists")
export class PlaylistsController {
  constructor(private playlistsService: PlaylistsService) {}

  @Get("me")
  @ApiOperation({ summary: "Get current user's playlists" })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 20 })
  @ApiQuery({ name: "offset", required: false, type: Number, example: 0 })
  @ApiResponse({ status: 200, type: PlaylistsResponseDto })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  async getMyPlaylists(
    @Req() req: Request,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string
  ): Promise<PlaylistsResponseDto> {
    const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
    if (!sessionId) {
      throw new UnauthorizedException("Not authenticated");
    }

    return this.playlistsService.getMyPlaylists(
      sessionId,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Get playlist by ID" })
  @ApiParam({ name: "id", description: "Spotify playlist ID" })
  @ApiResponse({ status: 200, type: PlaylistDetailsDto })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 404, description: "Playlist not found" })
  async getPlaylistById(
    @Req() req: Request,
    @Param("id") playlistId: string
  ): Promise<PlaylistDetailsDto> {
    const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
    if (!sessionId) {
      throw new UnauthorizedException("Not authenticated");
    }

    return this.playlistsService.getPlaylistById(sessionId, playlistId);
  }
}
