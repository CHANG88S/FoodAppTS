import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Image,
    TextInput,
    ActivityIndicator,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

export default function OnboardingScreen() {
    const router = useRouter();
    const { from, needsProfile } = useLocalSearchParams<{ from?: string; needsProfile?: string }>();
    const updateUser = useMutation(api.users.updateUser);
    const currentUser = useQuery(api.users.viewer);

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // OAuth sign-ups (Google/Apple) never chose a username or display name —
    // the backend generated placeholders — so they get an extra profile step.
    const hasProfileStep = needsProfile === '1';
    const [displayName, setDisplayName] = useState('');
    const [profileUsername, setProfileUsername] = useState('');

    // Live availability check while the user types a username.
    const usernameCheck = useQuery(
        api.users.getUserByUsername,
        profileUsername.trim().length >= 3
            ? { username: profileUsername.trim() }
            : 'skip'
    );

    // Taste preference states
    const [sweetness, setSweetness] = useState(50);
    const [iceLevel, setIceLevel] = useState(50);
    const [milkBase, setMilkBase] = useState('Oat Milk');
    const [favoriteCuisines, setFavoriteCuisines] = useState<string[]>([]);

    // Step order with/without the profile step for OAuth-created users.
    const stepKeys: string[] = hasProfileStep
        ? ['welcome', 'profile', 'taste', 'cuisines', 'allset']
        : ['welcome', 'taste', 'cuisines', 'allset'];
    const totalSteps = stepKeys.length;
    const currentKey = stepKeys[step - 1];

    // Only letters, numbers, and underscores make it into the input anyway
    // (sanitized on change), so availability is the real gate here.
    const profileStepValid =
        profileUsername.trim().length >= 3 &&
        /^[a-z0-9_]+$/.test(profileUsername.trim()) &&
        (usernameCheck == null || usernameCheck._id === currentUser?._id);

    // Prefill the profile step once the viewer loads (Google supplies the
    // display name; the backend generated the username). The viewer query's
    // return type is a union across tables, so this reads it as any.
    React.useEffect(() => {
        if (currentUser) {
            const viewer = currentUser as any;
            setDisplayName((prev) => prev || viewer.name || '');
            setProfileUsername((prev) => prev || viewer.username);
        }
    }, [currentUser]);

    const handleNext = async () => {
        if (step < totalSteps) {
            setStep(step + 1);
        } else {
            await completeOnboarding();
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        } else if (from === 'signup') {
            router.replace('/(tabs)/home');
        } else {
            // Replayed from the profile drawer — just return to the app.
            router.back();
        }
    };

    const completeOnboarding = async () => {
        setLoading(true);
        try {
            // Guests can browse the tour from the drawer but have no profile to save to.
            if (currentUser) {
                if (hasProfileStep) {
                    // Replace the backend-generated placeholder identity.
                    await updateUser({
                        username: profileUsername.trim(),
                        ...(displayName.trim() ? { name: displayName.trim() } : {}),
                    });
                }

                await updateUser({
                    preferences: {
                        sweetness,
                        iceLevel,
                        milkBase,
                        favoriteCuisines,
                    },
                });
            }

            // Track onboarding completion
            console.log('✅ Onboarding completed');

            if (from === 'signup') {
                router.replace('/(tabs)/home');
            } else {
                // Replayed from the profile drawer — return to the previous screen.
                router.back();
            }
        } catch (error) {
            console.error('Onboarding error:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleCuisine = (cuisine: string) => {
        if (favoriteCuisines.includes(cuisine)) {
            setFavoriteCuisines(favoriteCuisines.filter(c => c !== cuisine));
        } else {
            setFavoriteCuisines([...favoriteCuisines, cuisine]);
        }
    };

    const cuisines = [
        'Chinese', 'Japanese', 'Korean', 'Thai', 'Vietnamese',
        'Indian', 'Italian', 'Mexican', 'American', 'French'
    ];

    const renderStep = () => {
        switch (currentKey) {
            case 'welcome':
                return (
                    <View style={styles.stepContent}>
                        <View style={styles.emojiContainer}>
                            <Text style={styles.emoji}>👋</Text>
                        </View>
                        <Text style={styles.stepTitle}>Welcome to BuhEats!</Text>
                        <Text style={styles.stepDescription}>
                            Discover amazing restaurants and share your food experiences with our community
                        </Text>

                        <View style={styles.featureGrid}>
                            <View style={styles.featureItem}>
                                <Ionicons name="star-outline" size={24} color="#6c3b3b" />
                                <Text style={styles.featureText}>Rate & Review</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Ionicons name="people-outline" size={24} color="#6c3b3b" />
                                <Text style={styles.featureText}>Community</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Ionicons name="restaurant-outline" size={24} color="#6c3b3b" />
                                <Text style={styles.featureText}>Discover</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Ionicons name="bulb-outline" size={24} color="#6c3b3b" />
                                <Text style={styles.featureText}>AI Picks</Text>
                            </View>
                        </View>
                    </View>
                );

            case 'profile':
                return (
                    <View style={styles.stepContent}>
                        <View style={styles.emojiContainer}>
                            <Text style={styles.emoji}>👤</Text>
                        </View>
                        <Text style={styles.stepTitle}>Set up your profile</Text>
                        <Text style={styles.stepDescription}>
                            Choose how you&apos;ll appear to other food lovers on BuhEats
                        </Text>

                        <View style={styles.profileForm}>
                            <Text style={styles.preferenceLabel}>Display Name</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Display Name (optional)"
                                placeholderTextColor="#9CA3AF"
                                value={displayName}
                                onChangeText={setDisplayName}
                                autoCapitalize="words"
                                maxLength={50}
                            />

                            <Text style={styles.preferenceLabel}>Username</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="username"
                                placeholderTextColor="#9CA3AF"
                                value={profileUsername}
                                onChangeText={(text) =>
                                    setProfileUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                                }
                                autoCapitalize="none"
                                autoCorrect={false}
                                maxLength={20}
                            />
                            {profileUsername.length > 0 && profileUsername.length < 3 && (
                                <Text style={styles.fieldHintError}>At least 3 characters</Text>
                            )}
                            {profileUsername.length >= 3 && usernameCheck === null && (
                                <Text style={styles.fieldHintOk}>✓ {profileUsername} is available</Text>
                            )}
                            {profileUsername.length >= 3 && usernameCheck != null && usernameCheck._id !== currentUser?._id && (
                                <Text style={styles.fieldHintError}>That username is taken</Text>
                            )}
                        </View>
                    </View>
                );

            case 'taste':
                return (
                    <View style={styles.stepContent}>
                        <View style={styles.emojiContainer}>
                            <Text style={styles.emoji}>🧋</Text>
                        </View>
                        <Text style={styles.stepTitle}>Your Taste Profile</Text>
                        <Text style={styles.stepDescription}>
                            Help us personalize your recommendations by setting your taste preferences
                        </Text>

                        <View style={styles.preferenceSection}>
                            <Text style={styles.preferenceLabel}>Sweetness Level</Text>
                            <View style={styles.sliderContainer}>
                                <Text style={styles.sliderLabel}>No Sugar</Text>
                                <View style={styles.sliderTrack}>
                                    <TouchableOpacity
                                        style={[styles.sliderThumb, { left: `${(sweetness / 125) * 100}%` }]}
                                        onPressIn={() => {}}
                                        onPressOut={() => {}}
                                    />
                                </View>
                                <Text style={styles.sliderLabel}>Extra Sweet</Text>
                            </View>
                            <Text style={styles.preferenceValue}>{sweetness}%</Text>

                            <Text style={styles.preferenceLabel}>Ice Level</Text>
                            <View style={styles.sliderContainer}>
                                <Text style={styles.sliderLabel}>No Ice</Text>
                                <View style={styles.sliderTrack}>
                                    <TouchableOpacity
                                        style={[styles.sliderThumb, { left: `${(iceLevel / 125) * 100}%` }]}
                                    />
                                </View>
                                <Text style={styles.sliderLabel}>Extra Ice</Text>
                            </View>
                            <Text style={styles.preferenceValue}>{iceLevel}%</Text>

                            <Text style={styles.preferenceLabel}>Preferred Milk Base</Text>
                            <View style={styles.optionsContainer}>
                                {['Oat Milk', 'Almond Milk', 'Soy Milk', 'Coconut Milk', 'Dairy'].map((milk) => (
                                    <TouchableOpacity
                                        key={milk}
                                        style={[
                                            styles.optionButton,
                                            milkBase === milk && styles.selectedOption
                                        ]}
                                        onPress={() => setMilkBase(milk)}
                                    >
                                        <Text style={[
                                            styles.optionText,
                                            milkBase === milk && styles.selectedOptionText
                                        ]}>{milk}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>
                );

            case 'cuisines':
                return (
                    <View style={styles.stepContent}>
                        <View style={styles.emojiContainer}>
                            <Text style={styles.emoji}>🍜</Text>
                        </View>
                        <Text style={styles.stepTitle}>Favorite Cuisines</Text>
                        <Text style={styles.stepDescription}>
                            Select your favorite cuisines to get personalized recommendations
                        </Text>

                        <View style={styles.cuisineGrid}>
                            {cuisines.map((cuisine) => (
                                <TouchableOpacity
                                    key={cuisine}
                                    style={[
                                        styles.cuisineButton,
                                        favoriteCuisines.includes(cuisine) && styles.selectedCuisine
                                    ]}
                                    onPress={() => toggleCuisine(cuisine)}
                                >
                                    <Text style={[
                                        styles.cuisineText,
                                        favoriteCuisines.includes(cuisine) && styles.selectedCuisineText
                                    ]}>{cuisine}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.tipBox}>
                            <Ionicons name="information-circle-outline" size={16} color="#6c3b3b" />
                            <Text style={styles.tipText}>
                                Don&apos;t worry! You can always change these preferences later in settings.
                            </Text>
                        </View>
                    </View>
                );

            case 'allset':
                return (
                    <View style={styles.stepContent}>
                        <View style={styles.emojiContainer}>
                            <Text style={styles.emoji}>🎉</Text>
                        </View>
                        <Text style={styles.stepTitle}>You&apos;re All Set!</Text>
                        <Text style={styles.stepDescription}>
                            Here&apos;s a quick overview of what you can do with BuhEats
                        </Text>

                        <View style={styles.featuresList}>
                            <View style={styles.listItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                <Text style={styles.listText}>Rate and review menu items</Text>
                            </View>
                            <View style={styles.listItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                <Text style={styles.listText}>Discover new restaurants</Text>
                            </View>
                            <View style={styles.listItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                <Text style={styles.listText}>Connect with food lovers</Text>
                            </View>
                            <View style={styles.listItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                <Text style={styles.listText}>Get personalized recommendations</Text>
                            </View>
                            <View style={styles.listItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                <Text style={styles.listText}>Share your food journey</Text>
                            </View>
                        </View>

                        <View style={styles.finalTip}>
                            <Text style={styles.finalTipText}>
                                💡 Tip: Check out the social feed to see what others are rating!
                            </Text>
                        </View>
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        {[...Array(totalSteps)].map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.progressDot,
                                    index + 1 <= step && styles.activeDot
                                ]}
                            />
                        ))}
                    </View>
                    <Text style={styles.progressText}>{step} of {totalSteps}</Text>
                </View>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
                {renderStep()}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.nextButton, (loading || (currentKey === 'profile' && !profileStepValid)) && styles.disabledButton]}
                    onPress={handleNext}
                    disabled={loading || (currentKey === 'profile' && !profileStepValid)}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.nextButtonText}>
                            {step === totalSteps ? 'Get Started' : 'Continue'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 48,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        padding: 4,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    progressBar: {
        flexDirection: 'row',
        gap: 8,
    },
    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E5E7EB',
    },
    activeDot: {
        backgroundColor: '#6c3b3b',
    },
    progressText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 100,
    },
    stepContent: {
        alignItems: 'center',
    },
    profileForm: {
        width: '100%',
        gap: 4,
    },
    textInput: {
        height: 50,
        backgroundColor: '#FFFFFF',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        borderRadius: 12,
        marginTop: 8,
        marginBottom: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#3C4858',
    },
    fieldHintOk: {
        width: '100%',
        color: '#059669',
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 8,
    },
    fieldHintError: {
        width: '100%',
        color: '#DC2626',
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 8,
    },
    emojiContainer: {
        marginBottom: 20,
    },
    emoji: {
        fontSize: 64,
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12,
        textAlign: 'center',
    },
    stepDescription: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 20,
    },
    featureGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 16,
        marginBottom: 20,
    },
    featureItem: {
        alignItems: 'center',
        width: 100,
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    featureText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1F2937',
        marginTop: 8,
        textAlign: 'center',
    },
    preferenceSection: {
        width: '100%',
        gap: 24,
    },
    preferenceLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 12,
    },
    sliderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    sliderLabel: {
        fontSize: 12,
        color: '#6B7280',
        flex: 1,
    },
    sliderTrack: {
        flex: 2,
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        marginHorizontal: 12,
        position: 'relative',
    },
    sliderThumb: {
        position: 'absolute',
        width: 20,
        height: 20,
        backgroundColor: '#6c3b3b',
        borderRadius: 10,
        top: -6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    preferenceValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6c3b3b',
        width: 50,
        textAlign: 'right',
    },
    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    optionButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    selectedOption: {
        backgroundColor: '#6c3b3b',
        borderColor: '#6c3b3b',
    },
    optionText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#374151',
    },
    selectedOptionText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    cuisineGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 20,
    },
    cuisineButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    selectedCuisine: {
        backgroundColor: '#6c3b3b',
        borderColor: '#6c3b3b',
    },
    cuisineText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#374151',
    },
    selectedCuisineText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    tipBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FDE68A',
        gap: 8,
    },
    tipText: {
        fontSize: 12,
        color: '#92400E',
        flex: 1,
        lineHeight: 16,
    },
    featuresList: {
        width: '100%',
        gap: 16,
        marginBottom: 20,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    listText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
    finalTip: {
        backgroundColor: '#D1FAE5',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#A7F3D0',
        width: '100%',
    },
    finalTipText: {
        fontSize: 13,
        color: '#065F46',
        textAlign: 'center',
        lineHeight: 18,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    nextButton: {
        backgroundColor: '#6c3b3b',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.6,
    },
    nextButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});