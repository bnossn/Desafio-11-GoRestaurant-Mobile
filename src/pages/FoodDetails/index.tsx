import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { AppRegistry, Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: number;
  thumbnail_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      // Load a specific food with extras based on routeParams id

      const foodResponse = await api.get<Food>(`foods/${routeParams.id}`);

      const chosenFood = foodResponse.data;
      chosenFood.formattedPrice = formatValue(chosenFood.price);

      const chosenFoodExtras = chosenFood.extras.map(extra => ({
        ...extra,
        quantity: 0,
      }));

      setFood(chosenFood);
      setExtras(chosenFoodExtras);

      const favoriteResponse = await api.get<Food[]>('favorites', {
        params: {
          id: routeParams.id,
        },
      });

      setIsFavorite(!!favoriteResponse.data.length);
    }

    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    // Increment extra quantity
    const newExtraArray = extras;

    const extraIncrementIndex = newExtraArray.findIndex(
      extra => extra.id === id,
    );

    newExtraArray[extraIncrementIndex].quantity += 1;

    setExtras([...newExtraArray]);
  }

  function handleDecrementExtra(id: number): void {
    // Decrement extra quantity
    const newExtraArray = extras;

    const extraDecrementIndex = newExtraArray.findIndex(
      extra => extra.id === id,
    );

    if (newExtraArray[extraDecrementIndex].quantity === 0) {
      return;
    }

    newExtraArray[extraDecrementIndex].quantity -= 1;

    setExtras([...newExtraArray]);
  }

  function handleIncrementFood(): void {
    // Increment food quantity
    setFoodQuantity(oldFoodQuantity => oldFoodQuantity + 1);
  }

  function handleDecrementFood(): void {
    // Decrement food quantity
    if (foodQuantity === 1) {
      return;
    }

    setFoodQuantity(oldFoodQuantity => oldFoodQuantity - 1);
  }

  const toggleFavorite = useCallback(async () => {
    // Toggle if food is favorite or not
    if (isFavorite) {
      await api.delete(`favorites/${food.id}`);
    } else {
      await api.post('favorites', {
        id: food.id,
        name: food.name,
        description: food.description,
        price: food.price,
        category: food.category,
        image_url: food.image_url,
        thumbnail_url: food.thumbnail_url,
      });
    }

    setIsFavorite(!isFavorite);
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    // Calculate cartTotal
    let totalPrice = extras.reduce((accumulator, currentExtra) => {
      return accumulator + currentExtra.quantity * currentExtra.value;
    }, 0);

    totalPrice += Number(food.price);

    totalPrice *= foodQuantity;

    return formatValue(totalPrice);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    // Finish the order and save on the API

    api.post('orders', {
      id: new Date().getTime(),
      product_id: food.id,
      name: food.name,
      description: food.description,
      price: food.price,
      category: food.category,
      thumbnail_url: food.thumbnail_url,
      extras,
    });

    navigation.goBack();
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
