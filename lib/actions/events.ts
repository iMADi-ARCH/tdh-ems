import {
  EventsColumn,
  EventsRow,
  TypedSupabaseClient,
} from "../supabase/types";
import { ServerActionResponse } from "../types";
import { getGalleryImageUrlFromName } from "./utils";

const getEvent = async (
  id: string,
  supabase: TypedSupabaseClient
): Promise<EventsRow> => {
  const { data, error } = await supabase.from("events").select().eq("id", id);
  if (error) throw error;
  return data[0];
};

const getEventGallery = async (
  supabase: TypedSupabaseClient,
  eventId: string | number
) => {
  const { data, error } = await supabase.storage
    .from("event")
    .list(`${eventId}/gallery`, { sortBy: { column: "name", order: "asc" } });
  if (error) throw error;
  const imageURLs: string[] = data.map(
    (d) =>
      supabase.storage
        .from("event")
        .getPublicUrl(`${eventId}/gallery/${d.name}`).data.publicUrl
  );
  return imageURLs;
};

const getEventCoverImage = async (
  supabase: TypedSupabaseClient,
  eventId: string
) => {
  const { data, error } = await supabase
    .from("events")
    .select("cover_image_url")
    .eq("id", eventId);
  if (error) throw new Error(error.message);
  if (!data[0].cover_image_url) return null;
  const publicUrl = getGalleryImageUrlFromName(
    eventId,
    data[0].cover_image_url
  );
  return publicUrl;
};

const getEvents = async (
  supabase: TypedSupabaseClient,
  page: number,
  limit = 10,
  onlyPublished: boolean = false
) => {
  if (onlyPublished) {
    const { data, error } = await supabase
      .from("events")
      .select()
      .eq("published", onlyPublished)
      .range(page * limit, page * limit + limit - 1)
      .order("registration_end", { ascending: true, nullsFirst: false });
    if (error) throw new Error(error.message);
    return data;
  }
  const { data, error } = await supabase
    .from("events")
    .select()
    .range(page * limit, page * limit + limit - 1)
    .order("registration_end", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);

  return data;
};

const searchEvents = async (
  supabase: TypedSupabaseClient,
  term: string,
  column: Exclude<EventsColumn, "tags"> = "title",
  page: number = 0,
  limit = 10
) => {
  const { data, error } = await supabase
    .from("events")
    .select()
    .ilike(column, `%${term}%`)
    .range(page * limit, page * limit + limit - 1)
    .order("registration_end", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);

  return data;
};

const searchEventsByTags = async (
  supabase: TypedSupabaseClient,
  tags: string[],
  page: number = 0,
  limit = 10
) => {
  const { data, error } = await supabase
    .from("events")
    .select()
    .contains("tags", tags)
    .range(page * limit, page * limit + limit - 1)
    .order("registration_end", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);

  return data;
};

const getAllEvents = async (supabase: TypedSupabaseClient) => {
  const { data, error } = await supabase.from("events").select();
  if (error) throw new Error(error.message);
  return data;
};
export {
  getEvent,
  getEventGallery,
  getEventCoverImage,
  getEvents,
  getAllEvents,
  searchEvents,
  searchEventsByTags,
};
