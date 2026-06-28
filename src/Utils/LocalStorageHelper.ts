import AsyncStorage from '@react-native-async-storage/async-storage';

interface Props {
  key: string;
  value: string;
}

const setLocalData = async ({
  key,
  value,
}: Props): Promise<string | null | unknown> => {
  try {
    return await AsyncStorage.setItem(key, value);
  } catch (error) {
    return error;
  }
};

type PropsLocalData = {
  key: string;
};

const getLocalData = async ({
  key,
}: PropsLocalData): Promise<string | null | unknown> => {
  try {
    const answer = await AsyncStorage.getItem(key);
    if (!answer) {
      return null;
    } else {
      return answer;
    }
  } catch (error) {
    return error;
  }
};

const removeLocalData = async ({ key }: PropsLocalData): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('[LocalStorage] removeItem error:', error);
  }
};

export {setLocalData, getLocalData, removeLocalData};
