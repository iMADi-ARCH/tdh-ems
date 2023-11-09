"use server";

import { EventsRow } from "@/lib/dbTypes";
import { getSupabase } from "@/lib/supabase";
import { currentUserActions } from "@/lib/userActions";
import { revalidatePath } from "next/cache";

const getEvent = async (id: string) => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("events").select().eq("id", id);
  if (error) throw new Error(error.message);
  return data[0];
};

const updateEvent = async (
  newdata: Partial<EventsRow> & { id: string | number }
) => {
  const supabase = getSupabase();
  console.log("UPDATING", newdata);

  const { error } = await supabase
    .from("events")
    .update(newdata)
    .eq("id", newdata.id);
  if (error) throw new Error(error.message);
};

const createEvent = async (newdata: Omit<EventsRow, "id">) => {
  const supabase = getSupabase();
  const { error } = await supabase.from("events").insert(newdata);
  if (error) throw new Error(error.message);
};

const deleteEvent = async (id: string) => {
  const supabase = getSupabase();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw new Error(error.message);
};

const getEventGallery = async (eventId: string) => {
  const supabase = getSupabase();
  const { data, error } = await supabase.storage
    .from("event")
    .list(`${eventId}/gallery`, { sortBy: { column: "name", order: "asc" } });
  if (error) throw new Error(error.message);
  const imageURLs: string[] = data.map(
    (d) =>
      supabase.storage
        .from("event")
        .getPublicUrl(`${eventId}/gallery/${d.name}`).data.publicUrl
  );
  console.log(imageURLs);

  return imageURLs;
};

const uploadImageToGallery = async (eventId: string, fdata: FormData) => {
  const file = fdata.get("image")! as File;
  const supabase = getSupabase();
  const { data, error } = await supabase.storage
    .from("event")
    .upload(
      `${eventId}/gallery/${file.name.replaceAll(
        " ",
        "_"
      )}_t=${new Date().getMilliseconds()}`,
      file
    );
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/e/event/${eventId}`);
  revalidatePath("/events");
};

const deleteImageFromGallery = async (eventId: string, imageURL: string) => {
  const supabase = getSupabase();
  const imgPath = imageURL.split("event/")[1];
  const { data, error } = await supabase.storage
    .from("event")
    .remove([imgPath]);
  if (error) throw new Error(error.message);
  console.log(data);

  revalidatePath(`/dashboard/e/event/${eventId}`);
  revalidatePath("/events");
};

const uploadCoverImageToGallery = async (eventId: string, fdata: FormData) => {
  const file = fdata.get("image")! as File;
  const supabase = getSupabase();
  const { data, error } = await supabase.storage
    .from("event")
    .upload(`${eventId}/gallery/cover`, file, { upsert: true });
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/e/event/${eventId}`);
  revalidatePath("/events");
};

export {
  getEvent,
  updateEvent,
  createEvent,
  deleteEvent,
  getEventGallery,
  uploadCoverImageToGallery,
  uploadImageToGallery,
  deleteImageFromGallery,
};