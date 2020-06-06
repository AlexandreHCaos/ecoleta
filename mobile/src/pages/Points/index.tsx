import React, { useState, useEffect } from 'react'
import { View, TouchableOpacity, Text, ScrollView, Image, Alert } from 'react-native'

import { useNavigation } from '@react-navigation/native'
import { Feather as Icon } from '@expo/vector-icons'
import MapView, { Marker } from 'react-native-maps'
import { SvgUri } from 'react-native-svg'
import * as Location from 'expo-location'

import styles from './styles'
import api from '../../services/api'

interface Item {
  id: number;
  title: string;
  image_url: string;
}

interface Point {
  id: number;
  name: string;
  image: string;
  latitude: number;
  longitude: number;
}

interface PositionInfo {
  city: string
  street: string
  region: string
  postalCode: string
  country: string
  name: string
}

const Points = () => {
  const [items, setItems] = useState<Item[]>([])
  const [points, setPoints] = useState<Point[]>([])
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0])
  const [initialPositionInfo, setInitialPositionInfo] = useState<PositionInfo>({} as PositionInfo)
  const navigation = useNavigation();

  useEffect(() => {
    api.get('items').then(response => {
      setItems(response.data)
    })
  }, [])

  useEffect(() => {
    async function loadPosition() {
      const { status } = await Location.requestPermissionsAsync();

      if (status !== 'granted'){
        Alert.alert('Ooooops...', 'Precisamos de sua permissão para obter a sua localização')
        return
      }

      const location = await Location.getCurrentPositionAsync()
      const { latitude, longitude } = location.coords

      const locationInfos = await Location.reverseGeocodeAsync(location.coords)
      setInitialPositionInfo(locationInfos[0])

      setInitialPosition([
        latitude,
        longitude
      ])
    }

    loadPosition()
  }, [])

  useEffect(() => {
    api.get('points', {
      params: {
        city: initialPositionInfo.city,
        uf: initialPositionInfo.region,
        items: [1, 2, 3, 4, 5, 6]
      }
    }).then(response => {
      setPoints(response.data)
    })
  }, [initialPositionInfo])


  function handleNavigateBack() {
    navigation.goBack();
  }

  function handleNavigateToDetail(id: number) {
    navigation.navigate('Detail', { id })
  }

  function handleSelectItem(id: number) {
    const alreadySelected = selectedItems.findIndex(item => item === id);

    if (alreadySelected >= 0){
      const filtredItems = selectedItems.filter(item => item !== id);
      setSelectedItems(filtredItems);
    } else {
      setSelectedItems([ ...selectedItems, id ]); 
    }
  }

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity onPress={handleNavigateBack}>
          <Icon name="arrow-left" color="#34cb78" size={20} />
        </TouchableOpacity>

        <Text style={styles.title}>Bem vindo.</Text>
        <Text style={styles.description}>Encontre no mapa um ponto de coleta.</Text>
      
        <View style={styles.mapContainer}>
          { initialPosition[0] !== 0 && (
            <MapView 
              style={styles.map} 
                loadingEnabled={initialPosition[0] === 0}
                showsUserLocation
                initialRegion={{
                  latitude: initialPosition[0],
                  longitude: initialPosition[1],
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
            >
              {points.map(point => (
                <Marker
                  key={String(point.id)} 
                  style={styles.mapMarker}
                  onPress={() => handleNavigateToDetail(point.id)}
                  coordinate={{
                    latitude: point.latitude,
                    longitude: point.longitude
                  }}
                >
                  <View style={styles.mapMarkerContainer}>
                    <Image style={styles.mapMarkerImage} source={{ uri: point.image }} />
                    <Text style={styles.mapMarkerTitle}>{point.name}</Text>
                  </View>
                </Marker>
              ))}
            </MapView>
          )}
        </View>
      </View>

      <View style={styles.itemsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}  
        >
          {items.map(item => (
            <TouchableOpacity 
              key={String(item.id)} 
              style={[
                styles.item,
                selectedItems.includes(item.id) ? styles.selectedItem : {}
              ]}
              onPress={() => handleSelectItem(item.id)}
              activeOpacity={0.6}
            >
              <SvgUri width={42} height={42} uri={item.image_url} />
              <Text style={styles.itemTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}

        </ScrollView>
        
      </View>
    </>
  )
};

export default Points;
