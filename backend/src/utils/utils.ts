import { Image } from "@spotify/web-api-ts-sdk";

/**
 * Get the first image from a list of images
 * @param images - The list of images
 * @returns The first image URL
 */
export const getFirstImage = (images: Image[]): string => images?.[0]?.url || "";