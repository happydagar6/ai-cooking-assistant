# ✅ Quick Setup Checklist

## Before You Run the App

- [ ] Run the Supabase migration SQL to create tables
- [ ] Verify `.env.local` has all required keys
- [ ] Restart the development server (`npm run dev`)

## Testing External Recipe Viewing

- [ ] Go to /search page
- [ ] Search for a recipe
- [ ] Enable "Search the Web"
- [ ] Click "View" on a web recipe
- [ ] Modal opens with full recipe
- [ ] Modal stays open for 10+ seconds (doesn't auto-close)
- [ ] Can scroll within modal to see all ingredients and instructions

## Testing Favorite Saving

- [ ] While modal is open, click heart icon
- [ ] See "Saving..." text on button
- [ ] Heart turns red after save
- [ ] Toast shows "Added to favorites!"
- [ ] Close modal, search again for same recipe
- [ ] Click View on same recipe
- [ ] Heart should already be red (favorite persisted)

## Verify Database

In Supabase dashboard:

**external_recipes table:**
- [ ] Has entries for recipes you viewed
- [ ] Each recipe has: id, title, source_url, ingredients[], instructions[], etc.

**user_favorites table:**
- [ ] Has entries linking your user_id to recipe ids
- [ ] Each entry is unique (no duplicates)

**external_recipe_interactions table:**
- [ ] Tracks view/click events (optional, for analytics)

## If Something Breaks

1. **Modal won't open:**
   - Check console for JavaScript errors
   - Verify `/api/external-recipes/fetch` returns data
   - Check network tab for failed requests

2. **Favorites not saving:**
   - Check network tab → POST to `/api/external-recipes/favorites`
   - Should return 200 with saved recipe data
   - Check Supabase tables for your data
   - Verify you're logged in (Clerk)

3. **Auth error (401):**
   - Sign out and sign back in
   - Clear cookies/cache
   - Verify CLERK_SECRET_KEY is correct

4. **OpenAI parsing error:**
   - Verify OPENAI_API_KEY is valid
   - Try a different recipe URL
   - Check Supabase logs for errors

## Success Indicators

✅ You'll know it's working when:
1. Modal opens and stays open indefinitely
2. Heart icon turns red when clicked
3. Toast notification shows success
4. Next time you view same recipe, heart is already red
5. Supabase shows your data in the tables
