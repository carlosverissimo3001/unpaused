import { ApiPropertyOptional } from "@nestjs/swagger";

export class MetaGameExtrasVo {
    @ApiPropertyOptional({
        description: "Optional meta flags (e.g. showHeart for special win celebration)",
        type: Boolean,
    })
    showHeart?: boolean;

    constructor(showHeart?: boolean) {
        this.showHeart = showHeart;
    }
}

export class GameExtrasVo {
    @ApiPropertyOptional({
        description: "Optional personalized rank title (easter egg for special users)",
        type: String,
    })
    rankTitle?: string;

    @ApiPropertyOptional({
        description: "Optional personalized note (easter egg for special users)",
        type: String,
    })
    specialNote?: string;

    @ApiPropertyOptional({
        description: "Optional meta flags (e.g. showHeart for special win celebration)",
        type: Object,
    })
    meta?: MetaGameExtrasVo;

    constructor(rankTitle?: string, specialNote?: string, meta?: MetaGameExtrasVo) {
        this.rankTitle = rankTitle;
        this.specialNote = specialNote;
        this.meta = meta;
    }
}

