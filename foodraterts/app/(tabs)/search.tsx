import { View, Text } from 'react-native';
import CategoryButtons from '@/components/CategoryButtons';

export default function Search() {
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <CategoryButtons></CategoryButtons>
            <Text>Search Screen</Text>
        </View>
    );
}