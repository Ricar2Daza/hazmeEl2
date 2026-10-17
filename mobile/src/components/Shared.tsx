import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { ActivityIndicator, Snackbar, Text, Card, Chip, Button } from 'react-native-paper';
import { COLORS, APPLICATION_STATUS_COLORS, JOB_STATUS_COLORS } from '../constants';
import { Job, Application } from '../types';
import Ionicons from '@expo/vector-icons/Ionicons';

interface Props {
  loading?: boolean;
  children: React.ReactNode;
  style?: any;
  withoutScroll?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const ScreenContainer: React.FC<Props> = ({
  loading,
  children,
  style,
  withoutScroll,
  onRefresh,
  refreshing,
}) => {
  const Wrapper: any = withoutScroll ? View : ScrollView;
  const wrapperProps = withoutScroll
    ? {}
    : {
        refreshControl: onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} />
        ) : undefined,
        contentContainerStyle: [styles.scrollContent, style],
        keyboardShouldPersistTaps: 'handled',
      };
  return (
    <View style={[styles.container, style]}>
      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator animating size="large" color={COLORS.primary} />
        </View>
      ) : (
        <Wrapper {...wrapperProps}>{children}</Wrapper>
      )}
    </View>
  );
};

interface JobCardProps {
  job: Job;
  onPress: () => void;
  showAppCount?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onPress, showAppCount }) => {
  const budget = job.budgetMin === job.budgetMax
    ? `$${job.budgetMin}`
    : `$${job.budgetMin} - $${job.budgetMax}`;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.jobCard} mode="outlined">
        <Card.Content>
          <View style={styles.jobRow}>
            <Text style={styles.jobTitle} numberOfLines={2}>
              {job.title}
            </Text>
            <Chip
              textStyle={{ fontSize: 11 }}
              style={{ backgroundColor: `${JOB_STATUS_COLORS[job.status]}20`, borderWidth: 0 }}
            >
              <Text style={{ color: JOB_STATUS_COLORS[job.status], fontSize: 11 }}>
                {job.status}
              </Text>
            </Chip>
          </View>
          <Text style={styles.jobDesc} numberOfLines={2}>
            {job.description}
          </Text>
          <View style={styles.jobMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color={COLORS.gray500} />
              <Text style={styles.metaText} numberOfLines={1}>
                {job.locationAddress}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="cash-outline" size={14} color={COLORS.success} />
              <Text style={[styles.metaText, { color: COLORS.success, fontWeight: '600' }]}>
                {budget}
              </Text>
            </View>
            {job.category?.name && (
              <Chip style={styles.categoryChip} textStyle={{ fontSize: 11 }}>
                {job.category.name}
              </Chip>
            )}
          </View>
          {showAppCount && (job._count?.applications ?? 0) > 0 && (
            <View style={{ marginTop: 8 }}>
              <Chip mode="flat" style={{ alignSelf: 'flex-start', backgroundColor: COLORS.primary + '20' }}>
                <Ionicons name="people-outline" size={14} color={COLORS.primary} />
                <Text style={{ color: COLORS.primary, marginLeft: 4, fontSize: 12 }}>
                  {job._count!.applications} postulantes
                </Text>
              </Chip>
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

interface ApplicationCardProps {
  application: Application;
  onPress?: () => void;
  actions?: React.ReactNode;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({ application, onPress, actions }) => {
  const color = APPLICATION_STATUS_COLORS[application.status];
  const job = application.job;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} disabled={!onPress}>
      <Card style={styles.jobCard} mode="outlined">
        <Card.Content>
          <View style={styles.jobRow}>
            <Text style={styles.jobTitle} numberOfLines={2}>
              {job?.title || 'Trabajo'}
            </Text>
            <Chip
              textStyle={{ fontSize: 11 }}
              style={{ backgroundColor: `${color}20`, borderWidth: 0 }}
            >
              <Text style={{ color, fontSize: 11 }}>{application.status}</Text>
            </Chip>
          </View>
          {application.applicant && (
            <View style={[styles.metaItem, { marginTop: 6 }]}>
              <Ionicons name="person-outline" size={14} color={COLORS.gray500} />
              <Text style={styles.metaText}>
                {application.applicant.fullName}
              </Text>
            </View>
          )}
          {application.message && (
            <Text style={[styles.jobDesc, { marginTop: 6 }]} numberOfLines={3}>
              "{application.message}"
            </Text>
          )}
          {actions && <View style={{ marginTop: 12 }}>{actions}</View>}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

export const EmptyState: React.FC<{ message?: string; icon?: string; action?: { label: string; onPress: () => void } }> = ({
  message = 'No hay elementos para mostrar',
  icon = 'inbox-outline',
  action,
}) => (
  <View style={styles.emptyState}>
    <Ionicons name={icon as any} size={64} color={COLORS.gray300} />
    <Text style={styles.emptyText}>{message}</Text>
    {action && (
      <Button mode="contained" style={{ marginTop: 16 }} onPress={action.onPress}>
        {action.label}
      </Button>
    )}
  </View>
);

export interface SnackState {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface PropsSnack {
  snack: SnackState;
  onDismiss: () => void;
}

export const AppSnackbar: React.FC<PropsSnack> = ({ snack, onDismiss }) => (
  <Snackbar
    visible={snack.visible}
    onDismiss={onDismiss}
    duration={3000}
    style={[
      styles.snack,
      snack.type === 'success' && { backgroundColor: COLORS.success },
      snack.type === 'error' && { backgroundColor: COLORS.danger },
      snack.type === 'info' && { backgroundColor: COLORS.primary },
    ]}
  >
    {snack.message}
  </Snackbar>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  loadingWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  jobRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray800,
    flex: 1,
    marginRight: 8,
  },
  jobDesc: {
    fontSize: 13,
    color: COLORS.gray600,
    lineHeight: 18,
  },
  jobMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.gray600,
  },
  categoryChip: {
    backgroundColor: COLORS.gray100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: 12,
    color: COLORS.gray500,
    fontSize: 14,
    textAlign: 'center',
  },
  snack: {
    borderRadius: 8,
    marginBottom: 20,
  },
});
