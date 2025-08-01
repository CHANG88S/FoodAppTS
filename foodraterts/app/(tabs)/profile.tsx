import { View, Text, StyleSheet, Image } from 'react-native';


export default function Profile() {
    return (
    
        <View style={styles.root}>
            <Image
                source={{ uri: 'https://cdn.discordapp.com/attachments/1014354049333743626/1400724695866802246/Untitled.png?ex=688dae07&is=688c5c87&hm=e789a6023b4595f35753c5f68dd4b17b56c7a252c5c988f94b019273d1e9b0d5&' }} 
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
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 8,
        color: 'black',
        marginLeft: 20, // Align text with the image
    }

})
