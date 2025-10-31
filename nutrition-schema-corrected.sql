-- ========================================
-- CORRECTED Nutrition Schema for Supabase
-- Compatible with Clerk Authentication
-- ========================================

-- Create recipe_nutrition table for storing AI-generated nutrition data
CREATE TABLE IF NOT EXISTS recipe_nutrition (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipe_id UUID NOT NULL,
    user_id TEXT NOT NULL,
    
    -- Core nutrition data (per serving)
    nutrition_data JSONB NOT NULL DEFAULT '{}',
    
    -- Vitamins and minerals
    vitamins JSONB DEFAULT '{}',
    minerals JSONB DEFAULT '{}',
    
    -- Health scoring and tags
    health_score INTEGER CHECK (health_score >= 1 AND health_score <= 10),
    dietary_tags TEXT[] DEFAULT '{}',
    
    -- AI insights
    highlights TEXT[] DEFAULT '{}',
    concerns TEXT[] DEFAULT '{}',
    healthy_suggestions TEXT[] DEFAULT '{}',
    
    -- Analysis metadata
    servings INTEGER NOT NULL DEFAULT 1,
    analyzed_at TIMESTAMPTZ DEFAULT NOW(),
    analysis_version TEXT DEFAULT 'v1.0',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(recipe_id) -- One nutrition analysis per recipe
);

-- Add RLS (Row Level Security)
ALTER TABLE recipe_nutrition ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow all authenticated operations
-- (Access control is handled at the API level with Clerk authentication)
CREATE POLICY "Enable all operations for authenticated users" ON recipe_nutrition
    FOR ALL USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_recipe_nutrition_recipe_id ON recipe_nutrition(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_nutrition_user_id ON recipe_nutrition(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_nutrition_analyzed_at ON recipe_nutrition(analyzed_at);
CREATE INDEX IF NOT EXISTS idx_recipe_nutrition_health_score ON recipe_nutrition(health_score);
CREATE INDEX IF NOT EXISTS idx_recipe_nutrition_dietary_tags ON recipe_nutrition USING GIN(dietary_tags);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_recipe_nutrition_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating timestamps
DROP TRIGGER IF EXISTS trigger_update_recipe_nutrition_updated_at ON recipe_nutrition;
CREATE TRIGGER trigger_update_recipe_nutrition_updated_at
    BEFORE UPDATE ON recipe_nutrition
    FOR EACH ROW
    EXECUTE FUNCTION update_recipe_nutrition_updated_at();

-- Create a view for easy nutrition data access with recipe details
CREATE OR REPLACE VIEW recipe_nutrition_view AS
SELECT 
    rn.*,
    r.title as recipe_title,
    r.description as recipe_description,
    r.prep_time,
    r.cook_time,
    r.difficulty,
    r.cuisine_type
FROM recipe_nutrition rn
LEFT JOIN recipes r ON rn.recipe_id = r.id;

-- Add comments for documentation
COMMENT ON TABLE recipe_nutrition IS 'AI-generated nutritional analysis data for recipes';
COMMENT ON COLUMN recipe_nutrition.nutrition_data IS 'JSON object containing calories, protein, carbs, fat, fiber, sugar, sodium, cholesterol per serving';
COMMENT ON COLUMN recipe_nutrition.health_score IS 'AI-calculated health score from 1-10 based on nutritional density and balance';
COMMENT ON COLUMN recipe_nutrition.dietary_tags IS 'Common tags: vegan, vegetarian, gluten-free, dairy-free, keto, paleo, low-carb, high-protein, low-sodium, heart-healthy';
COMMENT ON COLUMN recipe_nutrition.analysis_version IS 'Version of AI analysis algorithm used for tracking improvements';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Recipe nutrition table and related objects created successfully!';
    RAISE NOTICE 'You can now use the nutrition analysis feature in your app.';
END $$;