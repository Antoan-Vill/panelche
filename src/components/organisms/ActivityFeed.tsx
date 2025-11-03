import { Card, CardHeader, CardContent, Heading } from '@/components/atoms';
import { ActivityItem } from '@/components/molecules/ActivityItem';

interface Activity {
  status: string;
  time: string;
  dotColor?: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  title?: string;
}

export function ActivityFeed({ activities, title = 'Recent Activity' }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <Heading level={2}>{title}</Heading>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <ActivityItem
              key={index}
              status={activity.status}
              time={activity.time}
              dotColor={activity.dotColor}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
