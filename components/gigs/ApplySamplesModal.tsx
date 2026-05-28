import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BeeButton } from '@/components/ui/BeeButton';
import { getDataErrorMessage } from '@/lib/errors';
import {
  pickApplicationDocuments,
  pickApplicationSamples,
  type PickedApplicationSample,
} from '@/lib/pickApplicationSamples';
import { uploadApplicationSampleFromUri } from '@/lib/uploadApplicationSample';
import { palette, radii, space } from '@/theme';

const MAX_SAMPLES = 6;

type Props = {
  visible: boolean;
  gigTitle: string;
  onClose: () => void;
  /** Called after samples are uploaded; parent submits the application with returned URLs. */
  onSubmit: (sampleUrls: string[]) => Promise<void>;
};

export function ApplySamplesModal({ visible, gigTitle, onClose, onSubmit }: Props) {
  const [samples, setSamples] = useState<PickedApplicationSample[]>([]);
  const [busy, setBusy] = useState(false);

  const addFromLibrary = async () => {
    Alert.alert('Add sample', 'Choose photos or files (PDF, Word, images).', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Photos',
        onPress: () => {
          void (async () => {
            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!perm.granted) {
              Alert.alert('Photos', 'Allow photo access to attach work samples.');
              return;
            }
            const left = MAX_SAMPLES - samples.length;
            if (left <= 0) {
              Alert.alert('Limit', `You can add up to ${MAX_SAMPLES} samples.`);
              return;
            }
            const picked = await pickApplicationSamples(left);
            if (!picked.length) return;
            setSamples((prev) => [...prev, ...picked].slice(0, MAX_SAMPLES));
          })();
        },
      },
      {
        text: 'Files',
        onPress: () => {
          void (async () => {
            const left = MAX_SAMPLES - samples.length;
            if (left <= 0) {
              Alert.alert('Limit', `You can add up to ${MAX_SAMPLES} samples.`);
              return;
            }
            const picked = await pickApplicationDocuments(left);
            if (!picked.length) return;
            setSamples((prev) => [...prev, ...picked].slice(0, MAX_SAMPLES));
          })();
        },
      },
    ]);
  };

  const removeAt = (idx: number) => {
    setSamples((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (samples.length < 1) {
      Alert.alert('Samples required', 'Add at least one work sample before applying.');
      return;
    }
    void (async () => {
      setBusy(true);
      try {
        const urls: string[] = [];
        for (let i = 0; i < samples.length; i++) {
          const s = samples[i]!;
          const url = await uploadApplicationSampleFromUri(s.uri, s.name, s.mime, s.base64);
          urls.push(url);
        }
        await onSubmit(urls);
        setSamples([]);
        onClose();
      } catch (e) {
        Alert.alert('Apply', getDataErrorMessage(e));
      } finally {
        setBusy(false);
      }
    })();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <AppText variant="title" style={{ flex: 1 }}>
              Work samples
            </AppText>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button">
              <Ionicons name="close" size={28} color={palette.black} />
            </Pressable>
          </View>
          <AppText variant="body" muted style={{ marginBottom: space.md }}>
            Applying to: {gigTitle}. Clients see these when reviewing applicants — at least one sample is required.
          </AppText>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: space.md }}>
            {samples.map((s, idx) => (
              <View key={`${s.uri}-${idx}`} style={styles.thumbWrap}>
                {s.mime.startsWith('image/') ? (
                  <Image source={{ uri: s.uri }} style={styles.thumb} contentFit="cover" />
                ) : (
                  <View style={[styles.thumb, styles.fileThumb]}>
                    <Ionicons name="document-text-outline" size={32} color={palette.black} />
                    <AppText variant="caption" numberOfLines={2} style={styles.fileName}>
                      {s.name}
                    </AppText>
                  </View>
                )}
                <Pressable style={styles.remove} onPress={() => removeAt(idx)} hitSlop={8}>
                  <Ionicons name="close-circle" size={22} color={palette.black} />
                </Pressable>
              </View>
            ))}
            {samples.length < MAX_SAMPLES ? (
              <Pressable style={styles.addTile} onPress={() => void addFromLibrary()}>
                <Ionicons name="add" size={36} color={palette.black} />
                <AppText variant="caption" style={{ marginTop: space.xs, fontWeight: '700' }}>
                  Add
                </AppText>
              </Pressable>
            ) : null}
          </ScrollView>

          {busy ? (
            <View style={{ alignItems: 'center', paddingVertical: space.sm }}>
              <ActivityIndicator size="small" color={palette.black} />
              <AppText variant="caption" muted style={{ marginTop: space.xs }}>
                Uploading samples…
              </AppText>
            </View>
          ) : null}

          <BeeButton
            title={busy ? 'Please wait…' : 'Submit application'}
            loading={busy}
            onPress={handleSubmit}
          />
          <View style={{ height: space.sm }} />
          <BeeButton title="Cancel" variant="ghost" disabled={busy} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: palette.cream,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    borderWidth: 2,
    borderColor: palette.black,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.xl,
    maxHeight: '88%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  thumbWrap: {
    width: 96,
    height: 96,
    marginRight: space.sm,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: palette.black,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  remove: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
  },
  addTile: {
    width: 96,
    height: 96,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: palette.black,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.yellow,
  },
  fileThumb: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xs,
    backgroundColor: palette.yellow,
  },
  fileName: {
    marginTop: space.xs,
    textAlign: 'center',
    fontWeight: '700',
  },
});
