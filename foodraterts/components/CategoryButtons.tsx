import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import foodCategories from '@/data/categories'
import { ScrollView } from 'react-native-gesture-handler'
import { MaterialCommunityIcons } from '@expo/vector-icons'



const CategoryButtons = () => {
  return (
    <View>
      <Text style = {styles.title}>Filter</Text>
      <ScrollView>
        {foodCategories.map((item, index)=> (
          <TouchableOpacity onPress={() => {}}>
            <MaterialCommunityIcons 
              name = {item.iconName as any}
              size = {16}
              color = 'black' />
            <Text>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

export default CategoryButtons

const styles = StyleSheet.create({
    title: {
      fontSize: 24,
      fontWeight: 700,
    }

})