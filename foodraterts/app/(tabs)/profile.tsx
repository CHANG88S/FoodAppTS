import { View, Text, StyleSheet, Image } from 'react-native';


export default function Profile() {
    return (
    
        <View style={styles.root}>
            <Image
                source={{ uri: 'https://example.com/profile.jpg' }} 
                style = {styles.image}>
            </Image>
            <Text style={styles.displayName}>
                CHANG88S 
            </Text>
            <View 
                style = {styles.center}>
            <Text>Profile Screen</Text> 
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root:{  
        flex: 1,
        position: 'relative',
    },
    container: {
        alignContent: 'flex-start',
        justifyContent: 'center',
        width: 320,
        height: 320,
    },
    image: {
        width: 100,
        height: 100,
        marginTop: 30,      // Margins only for image
        marginLeft: 20,     // Same Comment
        borderColor: 'gray',
        borderWidth: 2,
        borderRadius: 50,   // Half of width/height for a perfect circle
    },
    center: {
         flex: 4, 
         alignItems: 'center', 
         justifyContent: 'center' 
    },
    displayName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 10,
        color: 'black',
        marginLeft: 20, // Align text with the image
    }

})
