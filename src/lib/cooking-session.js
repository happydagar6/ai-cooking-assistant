import { supabase } from "./supabase";

export class CookingSessionService {
    static async startCookingSession(userId, recipeId){
        try {
            // End any existing active sessions for this recipe
            await supabase
            .from("cooking_sessions")
            .update({ status: 'abandoned' })
            .eq("user_id", userId)
            .eq("recipe_id", recipeId)
            .eq("status", 'active');

            const { data, error } = await supabase
            .from("cooking_sessions")
            .insert({
                user_id: userId,
                recipe_id: recipeId,
                current_step: 0,
                completed_steps: [],
                session_data: {
                    timers: [],
                    notes: [],
                    modifications: []
                },
                status: 'active'
            })
            .select()
            .single();

            if(error) throw error;
            return data;
        } catch (error) {
            console.error("Error starting cooking session:", error);
            throw error;
        }
    }
    static async updateCookingSession(sessionId, updates){
        try {
            const { data, error } = await supabase
            .from("cooking_sessions")
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq("id", sessionId)
            .select()
            .single();

            if(error) throw error;
            return data;
        } catch (error) {
            console.error("Error updating cooking session:", error);
            throw error;
        }
    }
    
    
    static async completeCookingSession(sessionId, userId){
        try {
            const { data: session, error: sessionError } = await supabase
            .from("cooking_sessions")
            .update({
                status: "completed",
                completed_at: new Date().toISOString()
            })
            .eq("id", sessionId)
            .select()
            .single();

            if(sessionError) throw sessionError;

            // Update cook count for user recipe
            const { error: updateError } = await supabase
            .rpc('increment_cook_count', {
                p_user_id: userId,
                p_recipe_id: session.recipe_id
            });
            if(updateError) console.error("Failed to update cook count:", updateError);
            return session;
            
        } catch (error) {
            console.error("Complete cooking session error:", error);
            throw error;
        }
    }

    static async getCookingSession(sessionId){
        try {
            const { data, error } = await supabase
            .from("cooking_sessions")
            .select(`*,
                recipe (
                    id,
                    title,
                    description,
                    ingredients,
                    instructions,
                    prep_time,
                    cook_time,
                    serving
                )
            `)
            .eq("id", sessionId)
            .single();

            if(error) throw error;
            return data;
        } catch (error) {
            console.error("Get cooking session error:", error);
            throw error;
        }
    }

    static async getActiveSessions(userId){
        try{
            const { data, error } = await supabase
            .from("cooking_sessions")
            .select(`
          *,
          recipes (
            id,
            title,
            description,
            prep_time,
            cook_time
          )
        `)
        .eq("user_id", userId)
        .in("status", ['active', 'paused'])
        .order('started_at', { ascending: false });
        if(error) throw error;
        return data;
        } catch (error) {
            console.error("Get active sessions error:", error);
            throw error;
        }
    }

    static async getSessionNote(sessionId, note){
        try {
            const { data: session } = await supabase
            .from("cooking_sessions")
            .select("session_data")
            .eq("id", sessionId)
            .single();

            const updatedData = {
                ...session.session_data,
                notes: [...session(session.session_data?.notes || []), {
                    id: crypto.randomUUID(),
                    note,
                    timestamp: new Date().toISOString()
                }]
            };
            return await this.updateCookingSession(sessionId, {session_data: updatedData});
        } catch (error) {
            console.error("Add session note error:", error);
            throw error;
        }
    }

    static async addSessionTimer(sessionId, timerData){
        try {
            const { data: session } = await supabase
            .from("cooking_sessions")
            .select("session_data")
            .eq("id", sessionId)
            .single();

            const updatedData = {
                ...session.session_data,
                timers: [...(session.session_data?.timers || []), {
                    id: crypto.randomUUID(),
                    ...timerData,
                    created_at: new Date().toISOString()
                }]
            };
            return await this.updateCookingSession(sessionId, {session_data: updatedData});
        } catch (error) {
            console.error("Add session timer error:", error);
            throw error;
        }
    }
}