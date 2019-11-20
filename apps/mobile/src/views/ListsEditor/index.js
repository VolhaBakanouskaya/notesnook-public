import React, {useEffect, useState, createRef, useCallback} from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Dimensions,
  FlatList,
} from 'react-native';
import {
  COLOR_SCHEME,
  SIZE,
  br,
  ph,
  pv,
  opacity,
  FONT,
  WEIGHT,
} from '../../common/common';
import Icon from 'react-native-vector-icons/Ionicons';

const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

const saveText = (type, title, content) => {
  let data = {
    type,
    title,
    headline: content.slice(0, 60),
    timestamp: Date.now(),
  };
};

export function useForceUpdate() {
  const [, setTick] = useState(0);
  const update = useCallback(() => {
    setTick(tick => tick + 1);
  }, []);
  return update;
}

const ListsEditor = ({navigation}) => {
  const [colors, setColors] = useState(COLOR_SCHEME);
  const [listData, setListData] = useState(['']);
  const forceUpdate = useForceUpdate();
  const _textRender = createRef();
  let prevItem = null;
  let prevIndex = null;
  let currentSelectedItem = null;

  return (
    <SafeAreaView>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: '5%',
          marginTop: Platform.OS == 'ios' ? h * 0.02 : h * 0.04,
          marginBottom: h * 0.04,
        }}>
        <TextInput
          style={{
            fontSize: SIZE.xxl,
            color: colors.pri,
            fontFamily: WEIGHT.bold,
            paddingVertical: 0,
            paddingHorizontal: 0,
            maxWidth: '90%',
            width: '90%',
          }}
          placeholder="Untitled List"
          placeholderTextColor={colors.icon}
        />
        <Icon name="md-more" color={colors.icon} size={SIZE.xxl} />
      </View>

      <TextInput
        ref={_textRender}
        style={{
          width: '90%',
          maxWidth: '90%',
          textAlignVertical: 'top',
          fontSize: SIZE.sm,
          fontFamily: WEIGHT.semibold,
          marginHorizontal: '5%',
          paddingVertical: pv - 5,
          borderRadius: 5,
          paddingHorizontal: ph - 5,
          backgroundColor: colors.navbg,
          marginBottom: 10,
        }}
        numberOfLines={3}
        maxLength={80}
        multiline={true}
        placeholder="Write a short note about the list."
        placeholderTextColor={colors.icon}
        onChangeText={value => {
          _text = value;
        }}
      />

      <FlatList
        data={listData}
        renderItem={({item, index}) => (
          <ListItem
            item={item}
            index={index}
            onSubmit={(text, index, willFocus = true) => {
              let oldData = listData;
              oldData[index] = text;

              if (
                oldData.length === index + 1 &&
                prevIndex !== null &&
                prevItem !== null
              ) {
                oldData.push('');
              }

              setListData(oldData);
              forceUpdate();
              currentSelectedItem = null;

              if (!willFocus) return;
              if (!refs[index + 1]) {
                setTimeout(() => {
                  refs[index + 1].focus();
                }, 400);
              } else {
                refs[index + 1].focus();
              }
            }}
            onChange={(text, index) => {
              prevIndex = index;
              prevItem = text;
            }}
            onFocus={index => {
              currentSelectedItem = index;
              if (currentSelectedItem) {
                let oldData = listData;
                oldData[prevIndex] = prevItem;
                if (oldData.length === prevIndex + 1) {
                  oldData.push('');
                }
                prevIndex = null;
                prevItem = null;
                setListData(oldData);
                console.log(oldData);
                forceUpdate();
              }
            }}
          />
        )}
      />
    </SafeAreaView>
  );
};

ListsEditor.navigationOptions = {
  header: null,
};

export default ListsEditor;

const refs = [];

const ListItem = props => {
  const [colors, setColors] = useState(COLOR_SCHEME);
  const inputRef = ref => (refs[props.index] = ref);

  const [showSubmit, setShowSubmit] = useState(false);
  let text = props.item;

  return (
    <View
      style={{
        flexDirection: 'row',
        width: '90%',
        maxWidth: '90%',
        marginHorizontal: '5%',
        marginVertical: 5,
      }}>
      <Text
        allowFontScaling={true}
        style={{
          paddingVertical: 5,
          height: 40,
          width: w * 0.9 * 0.1,
          textAlign: 'center',
          textAlignVertical: 'center',
          color: 'white',
          backgroundColor: colors.accent,
          borderRadius: 5,
          marginRight: 5,
          fontFamily: WEIGHT.regular,
          fontSize: SIZE.sm,
        }}>
        {props.index + 1}
      </Text>
      <TextInput
        ref={inputRef}
        placeholder={'List item - tap to edit'}
        style={{
          paddingVertical: 5,
          paddingHorizontal: ph,
          maxWidth: w * 0.9 * 0.8 - 10,
          backgroundColor: colors.navbg,
          borderRadius: 5,
        }}
        multiline={true}
        onFocus={() => props.onFocus(props.index)}
        onBlur={() => {
          setShowSubmit(false);
          props.onSubmit(text, props.index, false);
        }}
        onChangeText={value => {
          setShowSubmit(true);
          props.onChange(value, props.index);

          text = value;
        }}
        blurOnSubmit={true}
        onKeyPress={e => {
          if (e.nativeEvent.key === 'Enter') {
            e.preventDefault();
            props.onSubmit(text, props.index);
          }
        }}
      />
      {showSubmit ? (
        <TouchableOpacity
          activeOpacity={opacity}
          onPress={() => props.onSubmit(text, props.index)}
          style={{
            paddingVertical: 5,
            height: 40,
            minWidth: w * 0.9 * 0.1,
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            backgroundColor: colors.navbg,
            borderRadius: 5,
            marginLeft: 5,
          }}>
          <Icon name="ios-checkmark" color={colors.accent} size={SIZE.md} />
        </TouchableOpacity>
      ) : (
        undefined
      )}
    </View>
  );
};
