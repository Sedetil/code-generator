import { supabase } from "@/lib/supabase";
import type { CodeSnippet } from "@/components/code-generator";

// Save a new snippet
export async function saveSnippet(snippet: Omit<CodeSnippet, "id">) {
  try {
    const { data, error } = await supabase
      .from("snippets")
      .insert({
        title: snippet.title,
        language: snippet.language,
        prompt: snippet.prompt,
        code: snippet.code,
        user_id: snippet.userId || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      language: data.language,
      prompt: data.prompt,
      code: data.code,
      createdAt: new Date(data.created_at).getTime(),
      userId: data.user_id,
    } as CodeSnippet;
  } catch (error) {
    console.error("Error saving snippet:", error);
    throw error;
  }
}

// Get all snippets for a user
export async function getUserSnippets(userId: string) {
  try {
    const { data, error } = await supabase
      .from("snippets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data.map((snippet) => ({
      id: snippet.id,
      title: snippet.title,
      language: snippet.language,
      prompt: snippet.prompt,
      code: snippet.code,
      createdAt: new Date(snippet.created_at).getTime(),
      userId: snippet.user_id,
    })) as CodeSnippet[];
  } catch (error) {
    console.error("Error getting user snippets:", error);
    throw error;
  }
}

// Get a single snippet
export async function getSnippet(snippetId: string) {
  try {
    const { data, error } = await supabase
      .from("snippets")
      .select("*")
      .eq("id", snippetId)
      .single();

    if (error) throw error;

    if (!data) return null;

    return {
      id: data.id,
      title: data.title,
      language: data.language,
      prompt: data.prompt,
      code: data.code,
      createdAt: new Date(data.created_at).getTime(),
      userId: data.user_id,
    } as CodeSnippet;
  } catch (error) {
    console.error("Error getting snippet:", error);
    throw error;
  }
}

// Update a snippet
export async function updateSnippet(
  snippetId: string,
  data: Partial<CodeSnippet>
) {
  try {
    const { error } = await supabase
      .from("snippets")
      .update({
        title: data.title,
        language: data.language,
        prompt: data.prompt,
        code: data.code,
        updated_at: new Date().toISOString(),
      })
      .eq("id", snippetId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error("Error updating snippet:", error);
    throw error;
  }
}

// Delete a snippet
export async function deleteSnippet(snippetId: string) {
  try {
    const { error } = await supabase
      .from("snippets")
      .delete()
      .eq("id", snippetId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error("Error deleting snippet:", error);
    throw error;
  }
}

// Create or update user profile
export async function createUserProfile(userId: string, data: any) {
  try {
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      display_name: data.displayName || null,
      email: data.email || null,
      avatar_url: data.photoURL || null,
      auth_provider: data.authProvider || "email",
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;

    return true;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}

// Upload avatar image
export async function uploadAvatar(userId: string, file: File) {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Math.random()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`; // avatars bucket, tapi di subfolder per user

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

    // Update user profile with new avatar URL
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: data.publicUrl })
      .eq("id", userId);

    if (updateError) throw updateError;

    return data.publicUrl;
  } catch (error) {
    console.error("Error uploading avatar:", error);
    throw error;
  }
}

// Get user profile
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
}

export async function getUserSnippetCount(userId: string) {
  try {
    const { count, error } = await supabase
      .from("snippets")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) throw error;

    return count || 0;
  } catch (error) {
    console.error("Error getting user snippet count:", error);
    return 0;
  }
}

export async function getPopularLanguages() {
  try {
    const { data, error } = await supabase.from("snippets").select("language");

    if (error) throw error;

    // Count occurrences of each language
    const languageCounts: Record<string, number> = {};
    let totalSnippets = 0;

    data.forEach((snippet) => {
      if (snippet.language) {
        languageCounts[snippet.language] =
          (languageCounts[snippet.language] || 0) + 1;
        totalSnippets++;
      }
    });

    // Convert to percentage and sort
    const languageStats = Object.entries(languageCounts)
      .map(([language, count]) => ({
        language,
        percentage: Math.round((count / totalSnippets) * 100),
      }))
      .sort((a, b) => b.percentage - a.percentage);

    return languageStats.slice(0, 5); // Return top 5 languages
  } catch (error) {
    console.error("Error getting popular languages:", error);
    return [];
  }
}

export async function getPopularPrompts() {
  try {
    const { data, error } = await supabase
      .from("snippets")
      .select("prompt")
      .order("created_at", { ascending: false })
      .limit(100); // Get recent prompts

    if (error) throw error;

    // Count occurrences of each prompt
    const promptCounts: Record<string, number> = {};

    data.forEach((snippet) => {
      if (snippet.prompt && snippet.prompt.trim()) {
        promptCounts[snippet.prompt] = (promptCounts[snippet.prompt] || 0) + 1;
      }
    });

    // Sort by count and get top prompts
    const popularPrompts = Object.entries(promptCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5) // Top 5 prompts
      .map(([prompt]) => prompt);

    return popularPrompts;
  } catch (error) {
    console.error("Error getting popular prompts:", error);
    return [];
  }
}
