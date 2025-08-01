import { Box, Typography, Paper, Divider } from '@mui/material'
import Grid from '@mui/material/Grid2'
/**
 * FormReview Component
 * 
 * A reusable component for displaying form data in a review step before submission.
 * 
 * @param title - (defaults to "Review Your Information")
 * @param description - (defaults to "Please review all the information below before submitting.")
 * @param sections - Array of section objects
 *   - title: The section header
 *   - items: ReviewItemProps[] - Array of simple key-value pairs to display
 *   - groupedItems?: ReviewItemProps[][] - Optional array of item groups (for nested data like multiple contacts)
 * 
 * @example - use watch() and formData to create the sections array
 * const ReviewStep = ({ watch }) => {
 *   const formData = watch()
 *   
 *   const sections = [
 *     {
 *       title: "Location Information",
 *       items: [
 *         { label: "Name", value: formData.location?.name },
 *         { label: "Status", value: formData.location?.release_status }
 *       ]
 *     },
 *     {
 *       title: `Contacts (${formData.contacts?.length || 0})`,
 *       items: [],
 *       groupedItems: formData.contacts?.map((contact, index) => [
 *         { label: `Contact ${index + 1} - Name`, value: contact.name },
 *         { label: `Contact ${index + 1} - Role`, value: contact.role },
 *         { label: "Emails", value: `${contact.emails?.length || 0} email(s)` }
 *       ]) || []
 *     }
 *   ]
 *   
 *   return (
 *     <FormReview
 *       title="Review Your Information"
 *       description="Please review before submitting."
 *       sections={sections}
 *     />
 *   )
 * }
 */

interface ReviewItemProps {
  label: string
  value: string | number | null | undefined
}

interface ReviewSectionProps {
  title: string
  children: React.ReactNode
}

interface FormReviewProps {
  title?: string
  description?: string
  sections: {
    title: string
    items: ReviewItemProps[]
    groupedItems?: ReviewItemProps[][] // use for nested items
  }[]
}

const ReviewItem: React.FC<ReviewItemProps> = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'left', py: 0.5, gap: 1 }}>
    <Typography variant="body2" color="text.secondary">
      {label}:
    </Typography>
    <Typography variant="body2" fontWeight="medium">
      {value || 'Not specified'}
    </Typography>
  </Box>
)

const ReviewSection: React.FC<ReviewSectionProps> = ({ title, children }) => (
  <Grid size={12}>
    <Paper elevation={1} sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
        {title}
      </Typography>
      {children}
    </Paper>
  </Grid>
)

export const FormReview: React.FC<FormReviewProps> = ({
  title = "Review Your Information",
  description = "Please review all the information below before submitting.",
  sections
}) => {
  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {description}
          </Typography>
        )}
      </Grid>

      {sections.map((section, index) => (
        <ReviewSection key={index} title={section.title}>
          <Box>
            {section.items.map((item, itemIndex) => (
              <ReviewItem
                key={itemIndex}
                label={item.label}
                value={item.value}
              />
            ))}
            
            {section.groupedItems && section.groupedItems.map((group, groupIndex) => (
              <Box key={groupIndex}>
                {groupIndex > 0 && <Divider sx={{ my: 2 }} />}
                {group.map((item, itemIndex) => (
                  <ReviewItem
                    key={itemIndex}
                    label={item.label}
                    value={item.value}
                  />
                ))}
              </Box>
            ))}
          </Box>
        </ReviewSection>
      ))}
    </Grid>
  )
} 