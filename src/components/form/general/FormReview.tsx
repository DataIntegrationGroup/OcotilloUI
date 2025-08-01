import { Box, Typography, Paper, Divider } from '@mui/material'
import Grid from '@mui/material/Grid2'

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