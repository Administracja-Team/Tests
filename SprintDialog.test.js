import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { nextTick } from 'vue';
import SprintDialog from '../views/SprintDialog.vue';
import { useToast } from 'primevue/usetoast';

// Мокаем PrimeVue компоненты
vi.mock('primevue/button', () => ({
  default: {
    template: '<button class="p-button"><slot></slot></button>',
    props: ['icon', 'label', 'class'],
  },
}));
vi.mock('primevue/inputtext', () => ({
  default: {
    template: '<input class="p-inputtext" v-bind="$attrs" />',
    props: ['modelValue'],
  },
}));
vi.mock('primevue/calendar', () => ({
  default: {
    template: '<input class="p-calendar" v-bind="$attrs" />',
    props: ['modelValue', 'showIcon', 'dateFormat'],
  },
}));

// Мокаем useToast
vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(() => ({
    add: vi.fn(),
  })),
}));

describe('SprintDialog.vue', () => {
  // Хелпер для монтирования компонента
  const mountComponent = () => {
    const wrapper = mount(SprintDialog, {
      global: {
        stubs: {
          Button: false,
          InputText: false,
          Calendar: false,
        },
      },
    });
    // Логируем HTML для отладки
    console.log(wrapper.html());
    return wrapper;
  };

  it('рендерит форму для создания спринта', async () => {
    const wrapper = mountComponent();
    await nextTick(); // Ждём завершения реактивных обновлений
    expect(wrapper.find('.sprint-title').text()).toBe('New sprint');
    expect(wrapper.find('input[placeholder="Sprint name"]').exists()).toBe(true);
    expect(wrapper.find('input[placeholder="Sprint description"]').exists()).toBe(true);
    expect(wrapper.find('input[placeholder="Start date"]').exists()).toBe(true);
    expect(wrapper.find('input[placeholder="End date"]').exists()).toBe(true);
    expect(wrapper.find('.add-task-button').text()).toBe('Add task');
    expect(wrapper.find('.create-sprint-button').text()).toBe('Create a sprint');
  });

  it('закрывает форму при клике на кнопку закрытия', async () => {
    const wrapper = mountComponent();
    await nextTick();
    const closeButton = wrapper.find('.sprint-close-button');
    await closeButton.trigger('click');
    expect(wrapper.emitted('close-form')).toBeTruthy();
  });

  it('показывает уведомление при клике на кнопку добавления задачи', async () => {
    const wrapper = mountComponent();
    await nextTick();
    const addTaskButton = wrapper.find('.add-task-button');
    await addTaskButton.trigger('click');
    expect(useToast().add).toHaveBeenCalledWith({
      severity: 'info',
      summary: 'Info',
      detail: 'Add task functionality coming soon',
      life: 3000,
    });
  });

  it('показывает уведомление при клике на кнопку создания спринта', async () => {
    const wrapper = mountComponent();
    await nextTick();
    const createSprintButton = wrapper.find('.create-sprint-button');
    await createSprintButton.trigger('click');
    expect(useToast().add).toHaveBeenCalledWith({
      severity: 'info',
      summary: 'Info',
      detail: 'Create sprint functionality coming soon',
      life: 3000,
    });
  });
});