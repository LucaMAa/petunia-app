import React, { useState } from 'react';
import { Family, Pet } from '../types';
import { Reminder } from '../types/reminders';
import { PetListScreen } from '../screens/pets/PetListScreen';
import { PetDetailScreen } from '../screens/pets/PetDetailScreen';
import { PetFormScreen } from '../screens/pets/PetFormScreen';
import { PetDocumentsScreen } from '../screens/pets/PetDocumentsScreen';
import { ReminderListScreen } from '../screens/reminder/ReminderListScreen';
import { ReminderFormScreen } from '../screens/reminder/ReminderFormScreen';
import { AckHistoryScreen } from '../screens/reminder/AckHistoryScreen';

type PetRoute =
  | { name: 'list' }
  | { name: 'detail'; petId: string }
  | { name: 'documents'; petId: string }
  | { name: 'create' }
  | { name: 'edit'; pet: Pet }
  | { name: 'reminders'; petId: string; family: Family }
  | { name: 'reminder-create'; petId: string; family: Family }
  | { name: 'reminder-edit'; petId: string; family: Family; reminder: Reminder }
  | { name: 'ack-history'; petId: string; family: Family };

interface Props {
  refreshKey: number;
}

export function PetsNavigator({ refreshKey }: Props) {
  const [route, setRoute] = useState<PetRoute>({ name: 'list' });

  if (route.name === 'detail')
    return (
      <PetDetailScreen
        petId={route.petId}
        onBack={() => setRoute({ name: 'list' })}
        onEdit={(pet) => setRoute({ name: 'edit', pet })}
        onDelete={() => setRoute({ name: 'list' })}
        onOpenReminders={(family) => setRoute({ name: 'reminders', petId: route.petId, family })}
        onOpenDocuments={() => setRoute({ name: 'documents', petId: route.petId })}
      />
    );

  if (route.name === 'create')
    return (
      <PetFormScreen
        onSuccess={() => setRoute({ name: 'list' })}
        onCancel={() => setRoute({ name: 'list' })}
      />
    );

  if (route.name === 'edit')
    return (
      <PetFormScreen
        existingPet={route.pet}
        onSuccess={() => setRoute({ name: 'list' })}
        onCancel={() => setRoute({ name: 'detail', petId: route.pet.id })}
      />
    );

  if (route.name === 'reminders')
    return (
      <ReminderListScreen
        familyId={route.family.id}
        familyName={route.family.name}
        petId={route.petId}
        petName={route.family.pets?.find((p) => p.id === route.petId)?.name}
        onBack={() => setRoute({ name: 'detail', petId: route.petId })}
        onCreateReminder={() =>
          setRoute({ name: 'reminder-create', petId: route.petId, family: route.family })
        }
        onEditReminder={(reminder) =>
          setRoute({ name: 'reminder-edit', petId: route.petId, family: route.family, reminder })
        }
        onOpenAckHistory={() =>
          setRoute({ name: 'ack-history', petId: route.petId, family: route.family })
        }
      />
    );

  if (route.name === 'reminder-create')
    return (
      <ReminderFormScreen
        familyId={route.family.id}
        preselectedPetId={route.petId}
        pets={route.family.pets ?? []}
        onSuccess={() => setRoute({ name: 'reminders', petId: route.petId, family: route.family })}
        onCancel={() => setRoute({ name: 'reminders', petId: route.petId, family: route.family })}
      />
    );

  if (route.name === 'reminder-edit')
    return (
      <ReminderFormScreen
        familyId={route.family.id}
        preselectedPetId={route.petId}
        pets={route.family.pets ?? []}
        existingReminder={route.reminder}
        onSuccess={() => setRoute({ name: 'reminders', petId: route.petId, family: route.family })}
        onCancel={() => setRoute({ name: 'reminders', petId: route.petId, family: route.family })}
      />
    );

  if (route.name === 'ack-history')
    return (
      <AckHistoryScreen
        familyId={route.family.id}
        familyName={route.family.name}
        onBack={() => setRoute({ name: 'reminders', petId: route.petId, family: route.family })}
      />
    );

  if (route.name === 'documents')
    return (
      <PetDocumentsScreen
        petId={route.petId}
        onBack={() => setRoute({ name: 'detail', petId: route.petId })}
      />
    );

  return (
    <PetListScreen
      key={refreshKey}
      onCreatePet={() => setRoute({ name: 'create' })}
      onSelectPet={(pet) => setRoute({ name: 'detail', petId: pet.id })}
    />
  );
}
