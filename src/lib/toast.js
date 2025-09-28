'use client'

import { toast } from "sonner"

export const showToast = {
  success: (message, options = {}) => {
    return toast.success(message, {
      duration: 3000,
      ...options
    })
  },
  
  error: (message, options = {}) => {
    return toast.error(message, {
      duration: 4000,
      ...options
    })
  },
  
  info: (message, options = {}) => {
    return toast.info(message, {
      duration: 3000,
      ...options
    })
  },
  
  loading: (message, options = {}) => {
    return toast.loading(message, {
      ...options
    })
  },

  promise: (promise, options = {}) => {
    return toast.promise(promise, {
      loading: options.loading || 'Loading...',
      success: (data) => {
        return options.success || 'Success!'
      },
      error: (error) => {
        return options.error || 'Something went wrong'
      },
      ...options
    })
  },

  dismiss: (toastId) => {
    toast.dismiss(toastId)
  }
}

// Recipe-specific toast messages
export const recipeToasts = {
  saved: () => showToast.success('Recipe saved successfully! 🍳'),
  deleted: () => showToast.success('Recipe deleted successfully'),
  saveError: () => showToast.error('Failed to save recipe. Please try again.'),
  deleteError: () => showToast.error('Failed to delete recipe. Please try again.'),
  generated: () => showToast.success('Recipe generated successfully! ✨'),
  generateError: () => showToast.error('Failed to generate recipe. Please try again.'),
  
  // Functions that handle loading toast dismissal
  deleteSuccess: (recipeName, toastId) => {
    if (toastId) showToast.dismiss(toastId)
    showToast.success(`"${recipeName}" deleted successfully!`)
  },
  
  deleteError: (recipeName, toastId) => {
    if (toastId) showToast.dismiss(toastId)
    showToast.error(`Failed to delete "${recipeName}". Please try again.`)
  },
  
  saveSuccess: (recipeName, toastId) => {
    if (toastId) showToast.dismiss(toastId)
    showToast.success(`"${recipeName}" saved successfully! 🍳`)
  },
  
  saveError: (recipeName, toastId) => {
    if (toastId) showToast.dismiss(toastId)
    showToast.error(`Failed to save "${recipeName}". Please try again.`)
  }
}

// Add these to your existing toast functions
export const scalingToasts = {
  scaleSuccess: (servings) => showToast.success("Recipe Scaled", `Successfully scaled recipe for ${servings} servings`),
  scaleError: (error) => showToast.error("Scaling Error", `Failed to scale recipe: ${error}`),
  parsingWarning: (ingredient) => showToast.warning("Parsing Warning", `Could not parse ingredient: ${ingredient}`),
  resetSuccess: () => showToast.success("Reset Complete", "Recipe restored to original size"),
  invalidServings: () => showToast.error("Invalid Input", "Serving size must be between 1 and 50"),
}