import React, { useState } from 'react';
import { Family, FamilyInvite, Pet } from '../types';
import { Reminder } from '../types/reminders';
import { FamilyListScreen } from '../screens/families/FamilyListScreen';
import { FamilyDetailScreen } from '../screens/families/FamilyDetailScreen';
import { FamilyFormScreen } from '../screens/families/FamilyFormScreen';
import { InvitesScreen } from '../screens/families/InviteScreen';
import { ReminderListScreen } from '../screens/reminder/ReminderListScreen';
import { ReminderFormScreen } from '../screens/reminder/ReminderFormScreen';
import { AckHistoryScreen } from '../screens/reminder/AckHistoryScreen';

type FamilyRoute =
  | { name: 'list' }
  | { name: 'detail'; familyId: string }
  | { name: 'create' }
  | { name: 'edit'; family: Family }
  | { name: 'invites' }
  | { name: 'reminders'; familyId: string; familyName: string; pets: Pet[] }
  | { name: 'reminder-create'; familyId: string; pets: Pet[] }
  | { name: 'reminder-edit'; familyId: string; pets: Pet[]; reminder: Reminder }
  | { name: 'ack-history'; familyId: string; familyName: string };

interface Props {
  liveInvites: FamilyInvite[];
  onInviteResponded: (id: number) => void;
}

export function FamiliesNavigator({ liveInvites, onInviteResponded }: Props) {
  const [route, setRoute] = useState<FamilyRoute>({ name: 'list' });

  if (route.name === 'create')
    return (
      <FamilyFormScreen
        onSuccess={() => setRoute({ name: 'list' })}
        onCancel={() => setRoute({ name: 'list' })}
      />
    );

  if (route.name === 'edit')
    return (
      <FamilyFormScreen
        existingFamily={route.family}
        onSuccess={() => setRoute({ name: 'detail', familyId: route.family.id })}
        onCancel={() => setRoute({ name: 'detail', familyId: route.family.id })}
      />
    );

  if (route.name === 'detail')
    return (
      <FamilyDetailScreen
        familyId={route.familyId}
        onBack={() => setRoute({ name: 'list' })}
        onEdit={(family) => setRoute({ name: 'edit', family })}
        onDelete={() => setRoute({ name: 'list' })}
        onOpenReminders={(familyId, familyName, pets) =>
          setRoute({ name: 'reminders', familyId, familyName, pets })
        }
      />
    );

  if (route.name === 'invites')
    return (
      <InvitesScreen
        liveInvites={liveInvites}
        onInviteResponded={onInviteResponded}
        onBack={() => setRoute({ name: 'list' })}
      />
    );

  if (route.name === 'reminders')
    return (
      <ReminderListScreen
        familyId={route.familyId}
        familyName={route.familyName}
        onBack={() => setRoute({ name: 'detail', familyId: route.familyId })}
        onCreateReminder={() =>
          setRoute({ name: 'reminder-create', familyId: route.familyId, pets: route.pets })
        }
        onEditReminder={(reminder) =>
          setRoute({
            name: 'reminder-edit',
            familyId: route.familyId,
            pets: route.pets,
            reminder,
          })
        }
        onOpenAckHistory={() =>
          setRoute({
            name: 'ack-history',
            familyId: route.familyId,
            familyName: route.familyName,
          })
        }
      />
    );

  if (route.name === 'reminder-create')
    return (
      <ReminderFormScreen
        familyId={route.familyId}
        pets={route.pets}
        onSuccess={() => setRoute({ name: 'list' })}
        onCancel={() => setRoute({ name: 'list' })}
      />
    );

  if (route.name === 'reminder-edit')
    return (
      <ReminderFormScreen
        familyId={route.familyId}
        pets={route.pets}
        existingReminder={route.reminder}
        onSuccess={() => setRoute({ name: 'list' })}
        onCancel={() => setRoute({ name: 'list' })}
      />
    );

  if (route.name === 'ack-history')
    return (
      <AckHistoryScreen
        familyId={route.familyId}
        familyName={route.familyName}
        onBack={() =>
          setRoute({
            name: 'reminders',
            familyId: route.familyId,
            familyName: route.familyName,
            pets: [],
          })
        }
      />
    );

  return (
    <FamilyListScreen
      onCreateFamily={() => setRoute({ name: 'create' })}
      onSelectFamily={(f) => setRoute({ name: 'detail', familyId: f.id })}
      onOpenInvites={() => setRoute({ name: 'invites' })}
    />
  );
}
